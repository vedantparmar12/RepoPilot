export declare class GitHubAPIError extends Error {
    statusCode?: number | undefined;
    rateLimitRemaining?: number | undefined;
    rateLimitReset?: Date | undefined;
    constructor(message: string, statusCode?: number | undefined, rateLimitRemaining?: number | undefined, rateLimitReset?: Date | undefined);
}
export declare class PaginationError extends Error {
    constructor(message: string);
}
export declare class AuthenticationError extends Error {
    constructor(message: string);
}
export declare function handleError(error: any, toolName: string): {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: any;
        mimeType?: string;
    }>;
    isError: boolean;
};
//# sourceMappingURL=error-handler.d.ts.map