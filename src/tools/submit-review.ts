import { MCPTool, ToolResponse, SubmitReviewInput, SubmitReviewSchema } from '../types/mcp';
import { GitHubClient } from '../github/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('SubmitReviewTool');

export class SubmitReviewTool implements MCPTool {
  name = 'submit-review';
  description = 'Submit a complete review with approval status and optional inline comments';
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

      // Validate that we have a body or comments
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
      
      const output = this.generateReviewOutput(review, input, statusText);

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to submit review');
      
      // Provide helpful error messages
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

  private generateReviewOutput(review: any, input: SubmitReviewInput, statusText: string): string {
    let output = `## Review Submitted Successfully\n\n`;
    
    output += `**Review ID:** ${review.id}\n`;
    output += `**Status:** ${statusText}\n`;
    output += `**Reviewer:** @${review.user.login}\n`;
    output += `**Submitted:** ${review.submitted_at ? new Date(review.submitted_at).toLocaleString() : 'Just now'}\n\n`;
    
    if (review.body) {
      output += `### Review Summary\n\n`;
      output += `${review.body}\n\n`;
    }
    
    if (input.comments && input.comments.length > 0) {
      output += `### Inline Comments Added\n\n`;
      output += `This review includes ${input.comments.length} inline comment${input.comments.length !== 1 ? 's' : ''}:\n\n`;
      
      input.comments.forEach((comment, index) => {
        const lineInfo = comment.start_line 
          ? `lines ${comment.start_line}-${comment.line || comment.start_line}`
          : `line ${comment.line || 'N/A'}`;
        output += `${index + 1}. **${comment.path}** (${lineInfo})\n`;
        output += `   > ${comment.body.split('\n')[0]}${comment.body.includes('\n') ? '...' : ''}\n\n`;
      });
    }
    
    output += `---\n`;
    output += `The review has been successfully submitted to PR #${input.pr_number}.`;
    
    // Add a note about the review type
    if (input.event === 'APPROVE') {
      output += `\n\nThis approval allows the PR to be merged if all other requirements are met.`;
    } else if (input.event === 'REQUEST_CHANGES') {
      output += `\n\nThe author needs to address the requested changes before this PR can be merged.`;
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