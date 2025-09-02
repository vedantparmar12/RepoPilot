import { MCPTool, ToolResponse, SubmitReviewInput, SubmitReviewSchema } from '../types/mcp';
import { GitHubClient } from '../github/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('SubmitReviewTool');

export class SubmitReviewTool implements MCPTool {
  name = 'submit-review';
  description = 'Submit a complete review with approval status and optional inline comments. Supports auto-merge functionality to automatically merge PRs after approval when all requirements are met.';
  inputSchema = SubmitReviewSchema;
  
  private githubClient: GitHubClient;

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
  }

  async handler(args: unknown): Promise<ToolResponse> {
    try {
      const input = this.inputSchema.parse(args) as SubmitReviewInput;
      
      logger.info({
        owner: input.owner,
        repo: input.repo,
        pr_number: input.pr_number,
        event: input.event,
        comments_count: input.comments?.length || 0
      }, 'Submitting review');

      if (!input.body && (!input.comments || input.comments.length === 0)) {
        input.body = this.generateDefaultBody(input.event);
      }

      const review = await this.githubClient.createReview({
        owner: input.owner,
        repo: input.repo,
        pull_number: input.pr_number,
        body: input.body || '',
        event: input.event,
        comments: input.comments
      });

      const statusText = this.getStatusText(review.state);
      let mergeResult: any = null;
      
      // Handle auto-merge if enabled and review is approved
      if (input.auto_merge && input.event === 'APPROVE') {
        try {
          mergeResult = await this.handleAutoMerge(input);
        } catch (error: any) {
          logger.warn({ error: error.message }, 'Auto-merge failed, but review was submitted successfully');
          mergeResult = {
            merged: false,
            error: error.message
          };
        }
      }
      
      const output = this.generateReviewOutput(review, input, statusText, mergeResult);

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to submit review');
      
      let errorMessage = 'Failed to submit review';
      
      if (error.message?.includes('validation')) {
        errorMessage = 'Invalid review data. Please check your input parameters.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'Pull request not found. Please verify the repository and PR number.';
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorMessage = 'Authentication failed. Please check your GitHub token permissions.';
      } else if (error.message?.includes('422')) {
        errorMessage = 'The review could not be created. This might be because the PR is closed or you are trying to review your own PR.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      return {
        content: [{
          type: 'text',
          text: `## Review Submission Failed\n\n${errorMessage}\n\nPlease check the logs for more details.`
        }],
        isError: true
      };
    }
  }

  private generateDefaultBody(event: string): string {
    switch (event) {
      case 'APPROVE':
        return 'The changes look good to me. Approved.';
      case 'REQUEST_CHANGES':
        return 'This pull request requires changes before it can be merged.';
      case 'COMMENT':
        return 'I have reviewed the changes and left comments.';
      default:
        return 'Review submitted.';
    }
  }

  private async handleAutoMerge(input: SubmitReviewInput): Promise<{
    merged: boolean;
    sha?: string;
    message?: string;
    error?: string;
  }> {
    logger.info({
      owner: input.owner,
      repo: input.repo,
      pr_number: input.pr_number,
      merge_method: input.merge_method
    }, 'Attempting auto-merge');

    // Check if PR is mergeable
    const mergeability = await this.githubClient.checkPullRequestMergeability(
      input.owner,
      input.repo,
      input.pr_number
    );

    if (!mergeability.can_merge) {
      const reasons = [];
      if (!mergeability.mergeable) reasons.push('PR has conflicts');
      if (mergeability.merge_status_checks?.some((check: any) => check.state === 'failure')) {
        reasons.push('Some status checks are failing');
      }
      throw new Error(`Cannot merge PR: ${reasons.join(', ') || 'PR is not ready for merge'}`);
    }

    // Attempt to merge
    const mergeResult = await this.githubClient.mergePullRequest(
      input.owner,
      input.repo,
      input.pr_number,
      input.merge_method || 'merge',
      input.merge_commit_title,
      input.merge_commit_message
    );

    return {
      merged: mergeResult.merged,
      sha: mergeResult.sha,
      message: mergeResult.message
    };
  }

  private generateReviewOutput(review: any, input: SubmitReviewInput, statusText: string, mergeResult?: any): string {
    let output = `## Review Submitted Successfully\n\n`;
    
    output += `**Review ID:** ${review.id}\n`;
    output += `**Status:** ${statusText}\n`;
    output += `**Reviewer:** @${review.user.login}\n`;
    output += `**Submitted:** ${review.submitted_at ? new Date(review.submitted_at).toLocaleString() : 'Just now'}\n\n`;
    
    if (review.body) {
      output += '### Review Summary\n\n';
      output += `${review.body}\n\n`;
    }
    
    if (input.comments && input.comments.length > 0) {
      output += '### Inline Comments Added\n\n';
      output += `This review includes ${input.comments.length} inline comment${input.comments.length !== 1 ? 's' : ''}:\n\n`;
      
      input.comments.forEach((comment, index) => {
        const lineInfo = comment.start_line 
          ? `lines ${comment.start_line}-${comment.line || comment.start_line}`
          : `line ${comment.line || 'N/A'}`;
        output += `${index + 1}. **${comment.path}** (${lineInfo})\n`;
        output += `   > ${comment.body.split('\n')[0]}${comment.body.includes('\n') ? '...' : ''}\n\n`;
      });
    }
    
    // Add merge result section if auto-merge was attempted
    if (mergeResult) {
      output += '\n### Auto-Merge Result\n\n';
      
      if (mergeResult.merged) {
        output += `✅ **PR Successfully Merged!**\n\n`;
        output += `**Merge Method:** ${input.merge_method || 'merge'}\n`;
        if (mergeResult.sha) {
          output += `**Merge Commit:** ${mergeResult.sha.substring(0, 7)}\n`;
        }
        if (mergeResult.message) {
          output += `**Message:** ${mergeResult.message}\n`;
        }
        output += '\nThe pull request has been automatically merged after approval.\n';
      } else {
        output += `❌ **Auto-Merge Failed**\n\n`;
        if (mergeResult.error) {
          output += `**Reason:** ${mergeResult.error}\n`;
        }
        output += '\nThe review was submitted successfully, but the PR could not be automatically merged. You may need to merge it manually.\n';
      }
    }
    
    output += '\n---\n';
    output += `The review has been successfully submitted to PR #${input.pr_number}.`;
    
    if (input.event === 'APPROVE' && !input.auto_merge) {
      output += '\n\nThis approval allows the PR to be merged if all other requirements are met.';
    } else if (input.event === 'REQUEST_CHANGES') {
      output += '\n\nThe author needs to address the requested changes before this PR can be merged.';
    }
    
    return output;
  }

  private getStatusText(state: string): string {
    const statusMap: Record<string, string> = {
      'APPROVED': 'Approved',
      'CHANGES_REQUESTED': 'Changes Requested',
      'COMMENTED': 'Commented',
      'PENDING': 'Pending',
      'DISMISSED': 'Dismissed'
    };
    return statusMap[state] || state;
  }
}
