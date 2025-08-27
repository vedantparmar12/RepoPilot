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
    const input = this.inputSchema.parse(args) as SubmitReviewInput;
      
      logger.info({
        owner: input.owner,
        repo: input.repo,
        pr_number: input.pr_number,
        event: input.event,
        comments_count: input.comments?.length || 0
      }, 'Submitting review');

      const review = await this.githubClient.createReview({
        owner: input.owner,
        repo: input.repo,
        pull_number: input.pr_number,
        body: input.body,
        event: input.event,
        comments: input.comments
      });

      const statusText = this.getStatusText(review.state);
      
      const output = `# Review Submitted Successfully

**Review ID:** ${review.id}
**Status:** ${statusText}
**Author:** @${review.user.login}
**Submitted:** ${review.submitted_at ? new Date(review.submitted_at).toLocaleString() : 'Just now'}

## Review Summary
${review.body || '_No summary provided_'}

${input.comments && input.comments.length > 0 ? `
## Inline Comments
${input.comments.length} inline comment(s) were added with this review:
${input.comments.map((c, i) => `${i + 1}. **${c.path}** (line ${c.line || c.start_line || 'N/A'})`).join('\n')}
` : ''}

---
The review has been successfully submitted to PR #${input.pr_number}.`;

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
  }

  private getStatusText(state: string): string {
    const texts: Record<string, string> = {
      'APPROVED': 'Approved',
      'CHANGES_REQUESTED': 'Changes Requested',
      'COMMENTED': 'Commented',
      'PENDING': 'Pending',
      'DISMISSED': 'Dismissed'
    };
    return texts[state] || state;
  }
}