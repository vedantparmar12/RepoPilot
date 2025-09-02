import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
import { createLogger } from '../utils/logger';
import { handleError } from '../utils/error-handler';

const logger = createLogger('UpdateIssueTool');

const UpdateIssueInputSchema = z.object({
  owner: z.string().describe('Repository owner (username or organization)'),
  repo: z.string().describe('Repository name'),
  issue_number: z.number().describe('Issue number to update'),
  title: z.string().optional().describe('New issue title (optional)'),
  body: z.string().optional().describe('New issue body/description (optional)'),
  state: z.enum(['open', 'closed']).optional().describe('Issue state (optional)'),
  state_reason: z.enum(['completed', 'not_planned', 'reopened']).optional().describe('Reason for state change (optional)'),
  assignees: z.array(z.string()).optional().describe('List of usernames to assign to the issue (replaces existing)'),
  milestone: z.number().nullable().optional().describe('Milestone number to associate with the issue (use null to remove)'),
  labels: z.array(z.string()).optional().describe('List of labels to add to the issue (replaces existing)')
});

export class UpdateIssueTool implements MCPTool {
  name = 'update-issue';
  description = 'Update an existing GitHub issue including title, body, state, assignees, labels, and milestone';
  inputSchema = UpdateIssueInputSchema;

  constructor(private githubClient: GitHubClient) {}

  async handler(args: z.infer<typeof UpdateIssueInputSchema>): Promise<ToolResponse> {
    try {
      logger.info({ 
        owner: args.owner, 
        repo: args.repo, 
        issue_number: args.issue_number,
        updates: Object.keys(args).filter(key => key !== 'owner' && key !== 'repo' && key !== 'issue_number' && (args as any)[key] !== undefined)
      }, 'Updating GitHub issue');

      // Build update parameters from provided arguments
      const updateParams: any = {};
      
      if (args.title !== undefined) updateParams.title = args.title;
      if (args.body !== undefined) updateParams.body = args.body;
      if (args.state !== undefined) updateParams.state = args.state;
      if (args.state_reason !== undefined) updateParams.state_reason = args.state_reason;
      if (args.assignees !== undefined) updateParams.assignees = args.assignees;
      if (args.milestone !== undefined) updateParams.milestone = args.milestone;
      if (args.labels !== undefined) updateParams.labels = args.labels;

      // Validate that at least one field is being updated
      if (Object.keys(updateParams).length === 0) {
        throw new Error('At least one field must be provided to update the issue');
      }

      // Update the issue using GitHub API
      const updatedIssue = await this.githubClient.updateIssue({
        owner: args.owner,
        repo: args.repo,
        issue_number: args.issue_number,
        ...updateParams
      });

      const issueUrl = `https://github.com/${args.owner}/${args.repo}/issues/${updatedIssue.number}`;
      
      // Build update summary
      const updates: string[] = [];
      if (args.title !== undefined) updates.push(`title updated`);
      if (args.body !== undefined) updates.push(`description updated`);
      if (args.state !== undefined) updates.push(`state changed to ${args.state}`);
      if (args.state_reason !== undefined) updates.push(`state reason set to ${args.state_reason}`);
      if (args.assignees !== undefined) updates.push(`assignees updated (${args.assignees.length} assigned)`);
      if (args.milestone !== undefined) {
        updates.push(args.milestone === null ? 'milestone removed' : `milestone updated`);
      }
      if (args.labels !== undefined) updates.push(`labels updated (${args.labels.length} labels)`);

      const updateSummary = updates.join(', ');

      return {
        content: [{
          type: 'text',
          text: `Issue updated successfully!\n\n**Issue #${updatedIssue.number}**: ${updatedIssue.title}\n**URL**: ${issueUrl}\n**State**: ${updatedIssue.state}\n**Updates**: ${updateSummary}\n**Last Modified**: ${new Date(updatedIssue.updated_at).toLocaleString()}\n\nThe issue has been updated and is ready for continued collaboration.`
        }],
        isError: false
      };

    } catch (error) {
      logger.error({ error, args }, 'Failed to update issue');
      return handleError(error, 'update-issue');
    }
  }
}