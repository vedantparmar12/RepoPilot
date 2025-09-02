import { MCPTool, ToolResponse, ReadPRInput, ReadPRSchema } from '../types/mcp';
import { GitHubClient } from '../github/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('ReadPRTool');

export class ReadPRTool implements MCPTool {
  name = 'read-pr';
  description = 'Read pull request details including metadata and statistics';
  inputSchema = ReadPRSchema;
  
  private githubClient: GitHubClient;

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
  }

  async handler(args: unknown): Promise<ToolResponse> {
    const input = this.inputSchema.parse(args) as ReadPRInput;
    
    logger.info({
      owner: input.owner,
      repo: input.repo,
      pr_number: input.pr_number
    }, 'Reading pull request');

    const pr = await this.githubClient.getPullRequest(
      input.owner,
      input.repo,
      input.pr_number
    );

    const summary = `# PR #${pr.number}: ${pr.title}

**Author:** @${pr.user.login}
**State:** ${pr.state}${pr.merged ? ' (merged)' : ''}
**Created:** ${new Date(pr.created_at).toLocaleDateString()}
**Updated:** ${new Date(pr.updated_at).toLocaleDateString()}

## Statistics
- **Files Changed:** ${pr.changed_files}
- **Additions:** +${pr.additions}
- **Deletions:** -${pr.deletions}
- **Comments:** ${pr.comments}
- **Review Comments:** ${pr.review_comments}
- **Commits:** ${pr.commits}

## Branches
- **Base:** ${pr.base.ref} (${pr.base.sha.substring(0, 7)})
- **Head:** ${pr.head.ref} (${pr.head.sha.substring(0, 7)})

## Description
${pr.body || '_No description provided_'}

## Status
- **Mergeable:** ${pr.mergeable === null ? 'Checking...' : pr.mergeable ? 'Yes' : 'No (conflicts)'}
${pr.merged ? `- **Merged At:** ${new Date(pr.merged_at!).toLocaleString()}` : ''}

---
Use \`list-files\` to see all changed files, or \`read-file\` to examine specific file changes.`;

    return {
      content: [{
        type: 'text',
        text: summary
      }]
    };
  }
}