import { MCPTool, ToolResponse } from '../types/mcp';
import { GitHubClient } from '../github/client';
export declare class ReadFileTool implements MCPTool {
    name: string;
    description: string;
    inputSchema: import("zod").ZodObject<{
        owner: import("zod").ZodOptional<import("zod").ZodString>;
        repo: import("zod").ZodOptional<import("zod").ZodString>;
        pr_number: import("zod").ZodOptional<import("zod").ZodNumber>;
        filename: import("zod").ZodOptional<import("zod").ZodString>;
        context_token: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        owner?: string | undefined;
        repo?: string | undefined;
        pr_number?: number | undefined;
        filename?: string | undefined;
        context_token?: string | undefined;
    }, {
        owner?: string | undefined;
        repo?: string | undefined;
        pr_number?: number | undefined;
        filename?: string | undefined;
        context_token?: string | undefined;
    }>;
    private githubClient;
    constructor(githubClient: GitHubClient);
    handler(args: unknown): Promise<ToolResponse>;
    private handleNewRequest;
    private handleWithContext;
    private formatChunkResponse;
    private formatFileWithoutPatch;
}
//# sourceMappingURL=read-file.d.ts.map