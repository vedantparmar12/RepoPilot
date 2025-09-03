import { MCPTool, ToolResponse } from '../types/mcp';
import { GitHubClient } from '../github/client';
export declare class ReadPRTool implements MCPTool {
    name: string;
    description: string;
    inputSchema: import("zod").ZodObject<{
        owner: import("zod").ZodString;
        repo: import("zod").ZodString;
        pr_number: import("zod").ZodNumber;
    }, "strip", import("zod").ZodTypeAny, {
        owner: string;
        repo: string;
        pr_number: number;
    }, {
        owner: string;
        repo: string;
        pr_number: number;
    }>;
    private githubClient;
    constructor(githubClient: GitHubClient);
    handler(args: unknown): Promise<ToolResponse>;
}
//# sourceMappingURL=read-pr.d.ts.map