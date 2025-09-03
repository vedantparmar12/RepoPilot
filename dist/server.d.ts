export declare class GitHubPRServer {
    private server;
    private githubClient;
    private tools;
    constructor();
    private registerTools;
    private setupHandlers;
    private zodToJsonSchema;
    private zodFieldToJsonSchema;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=server.d.ts.map