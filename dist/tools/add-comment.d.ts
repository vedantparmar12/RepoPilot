import { MCPTool, ToolResponse } from '../types/mcp';
import { GitHubClient } from '../github/client';
export declare class AddCommentTool implements MCPTool {
    name: string;
    description: string;
    inputSchema: import("zod").ZodObject<{
        owner: import("zod").ZodString;
        repo: import("zod").ZodString;
        pr_number: import("zod").ZodNumber;
        path: import("zod").ZodString;
        line: import("zod").ZodOptional<import("zod").ZodNumber>;
        start_line: import("zod").ZodOptional<import("zod").ZodNumber>;
        side: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["LEFT", "RIGHT"]>>>;
        body: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        body: string;
        path: string;
        owner: string;
        repo: string;
        side: "LEFT" | "RIGHT";
        pr_number: number;
        line?: number | undefined;
        start_line?: number | undefined;
    }, {
        body: string;
        path: string;
        owner: string;
        repo: string;
        pr_number: number;
        line?: number | undefined;
        start_line?: number | undefined;
        side?: "LEFT" | "RIGHT" | undefined;
    }>;
    private githubClient;
    constructor(githubClient: GitHubClient);
    handler(args: unknown): Promise<ToolResponse>;
}
//# sourceMappingURL=add-comment.d.ts.map