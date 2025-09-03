import { MCPTool, ToolResponse } from '../types/mcp';
import { GitHubClient } from '../github/client';
export declare class ListFilesTool implements MCPTool {
    name: string;
    description: string;
    inputSchema: import("zod").ZodObject<{
        owner: import("zod").ZodString;
        repo: import("zod").ZodString;
        pr_number: import("zod").ZodNumber;
        page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
        per_page: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodNumber>>;
    }, "strip", import("zod").ZodTypeAny, {
        owner: string;
        repo: string;
        per_page: number;
        page: number;
        pr_number: number;
    }, {
        owner: string;
        repo: string;
        pr_number: number;
        per_page?: number | undefined;
        page?: number | undefined;
    }>;
    private githubClient;
    constructor(githubClient: GitHubClient);
    handler(args: unknown): Promise<ToolResponse>;
    private groupFilesByDirectory;
    private getStatusSummary;
    private formatGroupedFiles;
    private formatFileList;
    private getStatusBadge;
}
//# sourceMappingURL=list-files.d.ts.map