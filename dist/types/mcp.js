"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitReviewSchema = exports.AddCommentSchema = exports.ReadFileSchema = exports.ListFilesSchema = exports.ReadPRSchema = void 0;
const zod_1 = require("zod");
exports.ReadPRSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner (user or organization)'),
    repo: zod_1.z.string().describe('Repository name'),
    pr_number: zod_1.z.number().describe('Pull request number')
});
exports.ListFilesSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner (user or organization)'),
    repo: zod_1.z.string().describe('Repository name'),
    pr_number: zod_1.z.number().describe('Pull request number'),
    page: zod_1.z.number().optional().default(1).describe('Page number for pagination'),
    per_page: zod_1.z.number().optional().default(30).describe('Number of files per page')
});
exports.ReadFileSchema = zod_1.z.object({
    owner: zod_1.z.string().optional().describe('Repository owner (required if no context_token)'),
    repo: zod_1.z.string().optional().describe('Repository name (required if no context_token)'),
    pr_number: zod_1.z.number().optional().describe('Pull request number (required if no context_token)'),
    filename: zod_1.z.string().optional().describe('File path (required if no context_token)'),
    context_token: zod_1.z.string().optional().describe('Pagination context token from previous response')
});
exports.AddCommentSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner'),
    repo: zod_1.z.string().describe('Repository name'),
    pr_number: zod_1.z.number().describe('Pull request number'),
    path: zod_1.z.string().describe('File path to comment on'),
    line: zod_1.z.number().optional().describe('Line number for single-line comment'),
    start_line: zod_1.z.number().optional().describe('Start line for multi-line comment'),
    side: zod_1.z.enum(['LEFT', 'RIGHT']).optional().default('RIGHT').describe('Side of diff to comment on'),
    body: zod_1.z.string().describe('Comment body (supports markdown)')
});
exports.SubmitReviewSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner'),
    repo: zod_1.z.string().describe('Repository name'),
    pr_number: zod_1.z.number().describe('Pull request number'),
    event: zod_1.z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT', 'PENDING']).describe('Review action'),
    body: zod_1.z.string().optional().describe('Review summary body'),
    comments: zod_1.z.array(zod_1.z.object({
        path: zod_1.z.string().describe('File path'),
        line: zod_1.z.number().optional().describe('Line number'),
        start_line: zod_1.z.number().optional().describe('Start line for multi-line comment'),
        side: zod_1.z.enum(['LEFT', 'RIGHT']).optional().default('RIGHT'),
        start_side: zod_1.z.enum(['LEFT', 'RIGHT']).optional(),
        body: zod_1.z.string().describe('Comment body')
    })).optional().describe('Inline comments to include with review')
});
//# sourceMappingURL=mcp.js.map