import { MCPTool, ToolResponse } from '../types/mcp';
import { GitHubClient } from '../github/client';
export declare class SubmitReviewTool implements MCPTool {
    name: string;
    description: string;
    inputSchema: import("zod").ZodObject<{
        owner: import("zod").ZodString;
        repo: import("zod").ZodString;
        pr_number: import("zod").ZodNumber;
        event: import("zod").ZodEnum<["APPROVE", "REQUEST_CHANGES", "COMMENT", "PENDING"]>;
        body: import("zod").ZodOptional<import("zod").ZodString>;
        comments: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
            path: import("zod").ZodString;
            line: import("zod").ZodOptional<import("zod").ZodNumber>;
            start_line: import("zod").ZodOptional<import("zod").ZodNumber>;
            side: import("zod").ZodDefault<import("zod").ZodOptional<import("zod").ZodEnum<["LEFT", "RIGHT"]>>>;
            start_side: import("zod").ZodOptional<import("zod").ZodEnum<["LEFT", "RIGHT"]>>;
            body: import("zod").ZodString;
        }, "strip", import("zod").ZodTypeAny, {
            body: string;
            path: string;
            side: "LEFT" | "RIGHT";
            line?: number | undefined;
            start_line?: number | undefined;
            start_side?: "LEFT" | "RIGHT" | undefined;
        }, {
            body: string;
            path: string;
            line?: number | undefined;
            start_line?: number | undefined;
            side?: "LEFT" | "RIGHT" | undefined;
            start_side?: "LEFT" | "RIGHT" | undefined;
        }>, "many">>;
    }, "strip", import("zod").ZodTypeAny, {
        owner: string;
        repo: string;
        event: "PENDING" | "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
        pr_number: number;
        body?: string | undefined;
        comments?: {
            body: string;
            path: string;
            side: "LEFT" | "RIGHT";
            line?: number | undefined;
            start_line?: number | undefined;
            start_side?: "LEFT" | "RIGHT" | undefined;
        }[] | undefined;
    }, {
        owner: string;
        repo: string;
        event: "PENDING" | "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
        pr_number: number;
        body?: string | undefined;
        comments?: {
            body: string;
            path: string;
            line?: number | undefined;
            start_line?: number | undefined;
            side?: "LEFT" | "RIGHT" | undefined;
            start_side?: "LEFT" | "RIGHT" | undefined;
        }[] | undefined;
    }>;
    private githubClient;
    constructor(githubClient: GitHubClient);
    handler(args: unknown): Promise<ToolResponse>;
    private generateDefaultBody;
    private generateReviewOutput;
    private getStatusText;
}
//# sourceMappingURL=submit-review.d.ts.map