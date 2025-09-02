import { z } from 'zod';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  handler: (args: any) => Promise<ToolResponse>;
}

export interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: any;
    mimeType?: string;
  }>;
  isError?: boolean;
  _meta?: {
    progressToken?: string;
  };
}

export const ReadPRSchema = z.object({
  owner: z.string().describe('Repository owner (user or organization)'),
  repo: z.string().describe('Repository name'),
  pr_number: z.number().describe('Pull request number')
});

export const ListFilesSchema = z.object({
  owner: z.string().describe('Repository owner (user or organization)'),
  repo: z.string().describe('Repository name'),
  pr_number: z.number().describe('Pull request number'),
  page: z.number().optional().default(1).describe('Page number for pagination'),
  per_page: z.number().optional().default(30).describe('Number of files per page')
});

export const ReadFileSchema = z.object({
  owner: z.string().optional().describe('Repository owner (required if no context_token)'),
  repo: z.string().optional().describe('Repository name (required if no context_token)'),
  pr_number: z.number().optional().describe('Pull request number (required if no context_token)'),
  filename: z.string().optional().describe('File path (required if no context_token)'),
  context_token: z.string().optional().describe('Pagination context token from previous response')
});

export const AddCommentSchema = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  pr_number: z.number().describe('Pull request number'),
  path: z.string().describe('File path to comment on'),
  line: z.number().optional().describe('Line number for single-line comment'),
  start_line: z.number().optional().describe('Start line for multi-line comment'),
  side: z.enum(['LEFT', 'RIGHT']).optional().default('RIGHT').describe('Side of diff to comment on'),
  body: z.string().describe('Comment body (supports markdown)')
});

export const SubmitReviewSchema = z.object({
  owner: z.string().describe('Repository owner'),
  repo: z.string().describe('Repository name'),
  pr_number: z.number().describe('Pull request number'),
  event: z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT', 'PENDING']).describe('Review action'),
  body: z.string().optional().describe('Review summary body'),
  comments: z.array(z.object({
    path: z.string().describe('File path'),
    line: z.number().optional().describe('Line number'),
    start_line: z.number().optional().describe('Start line for multi-line comment'),
    side: z.enum(['LEFT', 'RIGHT']).optional().default('RIGHT'),
    start_side: z.enum(['LEFT', 'RIGHT']).optional(),
    body: z.string().describe('Comment body')
  })).optional().describe('Inline comments to include with review'),
  auto_merge: z.boolean().optional().default(false).describe('Automatically merge the PR if review is approved and all checks pass'),
  merge_method: z.enum(['merge', 'squash', 'rebase']).optional().default('merge').describe('Method to use when auto-merging the PR'),
  merge_commit_title: z.string().optional().describe('Custom commit title for merge (auto-generated if not provided)'),
  merge_commit_message: z.string().optional().describe('Custom commit message for merge (auto-generated if not provided)')
});

export type ReadPRInput = z.infer<typeof ReadPRSchema>;
export type ListFilesInput = z.infer<typeof ListFilesSchema>;
export type ReadFileInput = z.infer<typeof ReadFileSchema>;
export type AddCommentInput = z.infer<typeof AddCommentSchema>;
export type SubmitReviewInput = z.infer<typeof SubmitReviewSchema>;