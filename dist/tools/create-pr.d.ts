interface CreatePRArgs {
    owner: string;
    repo: string;
    title?: string;
    head: string;
    base: string;
    body?: string;
    draft?: boolean;
    auto_generate?: boolean;
}
export declare class CreatePRTool {
    private octokit;
    constructor(token: string);
    execute(args: CreatePRArgs): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
        isError?: undefined;
    } | {
        content: {
            type: "text";
            text: string;
        }[];
        isError: boolean;
    }>;
    private analyzeChanges;
    private categorizeFiles;
    private analyzeCommitTypes;
    private analyzeCodePatterns;
    private analyzeImpact;
    private extractFeatures;
    private analyzeTechnicalChanges;
    private analyzeDependencies;
    private generateProfessionalTitle;
    private generateComprehensiveBody;
    private generateExecutiveSummary;
    private getFileStatusIndicator;
    private getChangeIndicator;
}
export declare const createPRTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            owner: {
                type: string;
                description: string;
            };
            repo: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            head: {
                type: string;
                description: string;
            };
            base: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
            draft: {
                type: string;
                description: string;
            };
            auto_generate: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    handler: (args: CreatePRArgs) => Promise<{
        content: {
            type: "text";
            text: string;
        }[];
        isError?: undefined;
    } | {
        content: {
            type: "text";
            text: string;
        }[];
        isError: boolean;
    }>;
};
export {};
//# sourceMappingURL=create-pr.d.ts.map