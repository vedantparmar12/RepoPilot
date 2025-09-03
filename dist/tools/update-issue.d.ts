import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const UpdateIssueInputSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    issue_number: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodEnum<["open", "closed"]>>;
    state_reason: z.ZodOptional<z.ZodEnum<["completed", "not_planned", "reopened"]>>;
    assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    milestone: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
    issue_number: number;
    title?: string | undefined;
    body?: string | undefined;
    state?: "open" | "closed" | undefined;
    assignees?: string[] | undefined;
    labels?: string[] | undefined;
    milestone?: number | null | undefined;
    state_reason?: "completed" | "not_planned" | "reopened" | undefined;
}, {
    owner: string;
    repo: string;
    issue_number: number;
    title?: string | undefined;
    body?: string | undefined;
    state?: "open" | "closed" | undefined;
    assignees?: string[] | undefined;
    labels?: string[] | undefined;
    milestone?: number | null | undefined;
    state_reason?: "completed" | "not_planned" | "reopened" | undefined;
}>;
export declare class UpdateIssueTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        issue_number: z.ZodNumber;
        title: z.ZodOptional<z.ZodString>;
        body: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodEnum<["open", "closed"]>>;
        state_reason: z.ZodOptional<z.ZodEnum<["completed", "not_planned", "reopened"]>>;
        assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        milestone: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        issue_number: number;
        title?: string | undefined;
        body?: string | undefined;
        state?: "open" | "closed" | undefined;
        assignees?: string[] | undefined;
        labels?: string[] | undefined;
        milestone?: number | null | undefined;
        state_reason?: "completed" | "not_planned" | "reopened" | undefined;
    }, {
        owner: string;
        repo: string;
        issue_number: number;
        title?: string | undefined;
        body?: string | undefined;
        state?: "open" | "closed" | undefined;
        assignees?: string[] | undefined;
        labels?: string[] | undefined;
        milestone?: number | null | undefined;
        state_reason?: "completed" | "not_planned" | "reopened" | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: z.infer<typeof UpdateIssueInputSchema>): Promise<ToolResponse>;
}
export {};
//# sourceMappingURL=update-issue.d.ts.map