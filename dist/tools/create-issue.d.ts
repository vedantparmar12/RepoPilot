import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const CreateIssueInputSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    title: z.ZodString;
    body: z.ZodOptional<z.ZodString>;
    assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    milestone: z.ZodOptional<z.ZodNumber>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    owner: string;
    repo: string;
    body?: string | undefined;
    assignees?: string[] | undefined;
    labels?: string[] | undefined;
    milestone?: number | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
}, {
    title: string;
    owner: string;
    repo: string;
    body?: string | undefined;
    assignees?: string[] | undefined;
    labels?: string[] | undefined;
    milestone?: number | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
}>;
export declare class CreateIssueTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        title: z.ZodString;
        body: z.ZodOptional<z.ZodString>;
        assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        milestone: z.ZodOptional<z.ZodNumber>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        owner: string;
        repo: string;
        body?: string | undefined;
        assignees?: string[] | undefined;
        labels?: string[] | undefined;
        milestone?: number | undefined;
        priority?: "low" | "medium" | "high" | "critical" | undefined;
    }, {
        title: string;
        owner: string;
        repo: string;
        body?: string | undefined;
        assignees?: string[] | undefined;
        labels?: string[] | undefined;
        milestone?: number | undefined;
        priority?: "low" | "medium" | "high" | "critical" | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: z.infer<typeof CreateIssueInputSchema>): Promise<ToolResponse>;
}
export {};
//# sourceMappingURL=create-issue.d.ts.map