import { MCPTool, ToolResponse, AddCommentInput, AddCommentSchema } from '../types/mcp';
import { GitHubClient } from '../github/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('AddCommentTool');

export class AddCommentTool implements MCPTool {
  name = 'add-comment';
  description = 'Add an inline comment to a specific file and line in a pull request';
  inputSchema = AddCommentSchema;
  
  private githubClient: GitHubClient;

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
  }

  async handler(args: unknown): Promise<ToolResponse> {
    const input = this.inputSchema.parse(args) as AddCommentInput;
      
      logger.info({
        owner: input.owner,
        repo: input.repo,
        pr_number: input.pr_number,
        path: input.path,
        line: input.line,
        start_line: input.start_line
      }, 'Adding comment to pull request');

      const comment = await this.githubClient.createReviewComment(
        input.owner,
        input.repo,
        input.pr_number,
        {
          path: input.path,
          line: input.line,
          start_line: input.start_line,
          side: input.side,
          body: input.body
        }
      );

      const output = `# Comment Added Successfully

**File:** ${comment.path}
**Line:** ${comment.line || comment.original_line || 'N/A'}${comment.start_line ? ` (lines ${comment.start_line}-${comment.line})` : ''}
**Side:** ${comment.side || 'N/A'}
**Author:** @${comment.user.login}
**Created:** ${new Date(comment.created_at).toLocaleString()}

## Comment
${comment.body}

---
Comment ID: ${comment.id}
${comment.in_reply_to_id ? `Reply to comment: ${comment.in_reply_to_id}` : ''}`;

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
  }
}