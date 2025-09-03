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
export declare const ReadPRSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    pr_number: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
    pr_number: number;
}, {
    owner: string;
    repo: string;
    pr_number: number;
}>;
export declare const ListFilesSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    pr_number: z.ZodNumber;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
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
export declare const ReadFileSchema: z.ZodObject<{
    owner: z.ZodOptional<z.ZodString>;
    repo: z.ZodOptional<z.ZodString>;
    pr_number: z.ZodOptional<z.ZodNumber>;
    filename: z.ZodOptional<z.ZodString>;
    context_token: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
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
export declare const AddCommentSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    pr_number: z.ZodNumber;
    path: z.ZodString;
    line: z.ZodOptional<z.ZodNumber>;
    start_line: z.ZodOptional<z.ZodNumber>;
    side: z.ZodDefault<z.ZodOptional<z.ZodEnum<["LEFT", "RIGHT"]>>>;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
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
export declare const SubmitReviewSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    pr_number: z.ZodNumber;
    event: z.ZodEnum<["APPROVE", "REQUEST_CHANGES", "COMMENT", "PENDING"]>;
    body: z.ZodOptional<z.ZodString>;
    comments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        line: z.ZodOptional<z.ZodNumber>;
        start_line: z.ZodOptional<z.ZodNumber>;
        side: z.ZodDefault<z.ZodOptional<z.ZodEnum<["LEFT", "RIGHT"]>>>;
        start_side: z.ZodOptional<z.ZodEnum<["LEFT", "RIGHT"]>>;
        body: z.ZodString;
    }, "strip", z.ZodTypeAny, {
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
}, "strip", z.ZodTypeAny, {
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
export type ReadPRInput = z.infer<typeof ReadPRSchema>;
export type ListFilesInput = z.infer<typeof ListFilesSchema>;
export type ReadFileInput = z.infer<typeof ReadFileSchema>;
export type AddCommentInput = z.infer<typeof AddCommentSchema>;
export type SubmitReviewInput = z.infer<typeof SubmitReviewSchema>;
//# sourceMappingURL=mcp.d.ts.map