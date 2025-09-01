import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
import { createLogger } from '../utils/logger';
import { handleError } from '../utils/error-handler';

const logger = createLogger('CloseIssueTool');

const CloseIssueInputSchema = z.object({
  owner: z.string().describe('Repository owner (username or organization)'),
  repo: z.string().describe('Repository name'),
  issue_number: z.number().describe('Issue number to close'),
  reason: z.enum(['completed', 'not_planned']).optional().default('completed').describe('Reason for closing the issue'),
  comment: z.string().optional().describe('Optional comment to add when closing the issue')
});

export class CloseIssueTool implements MCPTool {
  name = 'close-issue';
  description = 'Close a GitHub issue with optional reason and comment - convenient wrapper for common close operations';
  inputSchema = CloseIssueInputSchema;

  constructor(private githubClient: GitHubClient) {}

  async handler(args: z.infer<typeof CloseIssueInputSchema>): Promise<ToolResponse> {
    try {
      logger.info({ 
        owner: args.owner, 
        repo: args.repo, 
        issue_number: args.issue_number,
        reason: args.reason 
      }, 'Closing GitHub issue');

      // Add comment if provided
      if (args.comment) {
        await this.githubClient.createIssueComment({
          owner: args.owner,
          repo: args.repo,
          issue_number: args.issue_number,
          body: args.comment
        });
      }

      // Close the issue using GitHub API
      const closedIssue = await this.githubClient.updateIssue({
        owner: args.owner,
        repo: args.repo,
        issue_number: args.issue_number,
        state: 'closed',
        state_reason: args.reason
      });

      const issueUrl = `https://github.com/${args.owner}/${args.repo}/issues/${closedIssue.number}`;
      
      const reasonText = args.reason === 'completed' ? 'as completed' : 'as not planned';
      const commentText = args.comment ? `\n**Closing Comment**: "${args.comment}"` : '';

      return {
        content: [{
          type: 'text',
          text: `Issue closed successfully!\n\n**Issue #${closedIssue.number}**: ${closedIssue.title}\n**URL**: ${issueUrl}\n**Closed**: ${reasonText}${commentText}\n**Closed At**: ${new Date(closedIssue.updated_at).toLocaleString()}\n\nThe issue has been closed and is no longer active.`
        }],
        isError: false
      };

    } catch (error) {
      logger.error({ error, args }, 'Failed to close issue');
      return handleError(error, 'close-issue');
    }
  }
}