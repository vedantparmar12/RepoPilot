"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCommentTool = void 0;
const mcp_1 = require("../types/mcp");
const logger_1 = require("../utils/logger");
const logger = (0, logger_1.createLogger)('AddCommentTool');
class AddCommentTool {
    name = 'add-comment';
    description = 'Add an inline comment to a specific file and line in a pull request';
    inputSchema = mcp_1.AddCommentSchema;
    githubClient;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        const input = this.inputSchema.parse(args);
        logger.info({
            owner: input.owner,
            repo: input.repo,
            pr_number: input.pr_number,
            path: input.path,
            line: input.line,
            start_line: input.start_line
        }, 'Adding comment to pull request');
        const comment = await this.githubClient.createReviewComment(input.owner, input.repo, input.pr_number, {
            path: input.path,
            line: input.line,
            start_line: input.start_line,
            side: input.side,
            body: input.body
        });
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
exports.AddCommentTool = AddCommentTool;
//# sourceMappingURL=add-comment.js.map