"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadPRTool = void 0;
const mcp_1 = require("../types/mcp");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('ReadPRTool');
class ReadPRTool {
    name = 'read-pr';
    description = 'Read pull request details including metadata and statistics';
    inputSchema = mcp_1.ReadPRSchema;
    githubClient;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        const input = this.inputSchema.parse(args);
        logger.info({
            owner: input.owner,
            repo: input.repo,
            pr_number: input.pr_number
        }, 'Reading pull request');
        const pr = await this.githubClient.getPullRequest(input.owner, input.repo, input.pr_number);
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
${pr.merged ? `- **Merged At:** ${new Date(pr.merged_at).toLocaleString()}` : ''}

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
exports.ReadPRTool = ReadPRTool;
//# sourceMappingURL=read-pr.js.map