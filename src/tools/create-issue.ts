import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
import { createLogger } from '../utils/logger';
import { handleError } from '../utils/error-handler';

const logger = createLogger('CreateIssueTool');

const CreateIssueInputSchema = z.object({
  owner: z.string().describe('Repository owner (username or organization)'),
  repo: z.string().describe('Repository name'),
  title: z.string().min(1).describe('Issue title (required)'),
  body: z.string().optional().describe('Issue body/description (optional)'),
  assignees: z.array(z.string()).optional().describe('List of usernames to assign to the issue'),
  milestone: z.number().optional().describe('Milestone number to associate with the issue'),
  labels: z.array(z.string()).optional().describe('List of labels to add to the issue'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Issue priority level')
});

export class CreateIssueTool implements MCPTool {
  name = 'create-issue';
  description = 'Create a new GitHub issue in a professional format with proper structure and optional metadata';
  inputSchema = CreateIssueInputSchema;

  constructor(private githubClient: GitHubClient) {}

  async handler(args: z.infer<typeof CreateIssueInputSchema>): Promise<ToolResponse> {
    try {
      logger.info({ 
        owner: args.owner, 
        repo: args.repo, 
        title: args.title 
      }, 'Creating GitHub issue');

      // Format the issue body professionally
      let formattedBody = args.body || '';
      
      // Add priority section if specified
      if (args.priority) {
        const priorityLabel = {
          'low': 'LOW',
          'medium': 'MEDIUM', 
          'high': 'HIGH',
          'critical': 'CRITICAL'
        }[args.priority];
        
        formattedBody = `**Priority:** ${priorityLabel}\n\n${formattedBody}`;
      }

      // Add professional structure if body is provided
      if (formattedBody && !formattedBody.includes('## ')) {
        // Check if it's a simple description and add basic structure
        if (formattedBody.length > 50) {
          const originalBody = formattedBody;
          formattedBody = `## Description\n\n${originalBody}\n\n## Acceptance Criteria\n\n- [ ] To be defined\n\n## Additional Notes\n\n_Please add any additional context or requirements._`;
        }
      }

      // Create the issue using GitHub API
      const issueData = await this.githubClient.createIssue({
        owner: args.owner,
        repo: args.repo,
        title: args.title,
        body: formattedBody,
        assignees: args.assignees,
        milestone: args.milestone,
        labels: args.labels
      });

      const issueUrl = `https://github.com/${args.owner}/${args.repo}/issues/${issueData.number}`;

      return {
        content: [{
          type: 'text',
          text: `Issue created successfully!\n\n**Issue #${issueData.number}**: ${issueData.title}\n**URL**: ${issueUrl}\n**State**: ${issueData.state}\n**Created**: ${new Date(issueData.created_at).toLocaleString()}\n\nThe issue has been created with a professional structure and is ready for team collaboration.`
        }],
        isError: false
      };

    } catch (error) {
      logger.error({ error, args }, 'Failed to create issue');
      return handleError(error, 'create-issue');
    }
  }
}