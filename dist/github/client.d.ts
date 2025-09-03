import { PullRequest, FileDiff, ReviewComment, Review, CreateReviewParams, GitHubIssue, CreateIssueParams, UpdateIssueParams, CreateIssueCommentParams } from '../types/github';
export declare class GitHubClient {
    private octokit;
    private rateLimiter;
    constructor(token?: string);
    getPullRequest(owner: string, repo: string, pull_number: number): Promise<PullRequest>;
    listPullRequestFiles(owner: string, repo: string, pull_number: number, page?: number, per_page?: number): Promise<{
        files: FileDiff[];
        hasMore: boolean;
    }>;
    getFileDiff(owner: string, repo: string, pull_number: number, filename: string): Promise<FileDiff | null>;
    createReviewComment(owner: string, repo: string, pull_number: number, comment: {
        path: string;
        line?: number;
        start_line?: number;
        side?: 'LEFT' | 'RIGHT';
        start_side?: 'LEFT' | 'RIGHT';
        body: string;
    }): Promise<ReviewComment>;
    createReview(params: CreateReviewParams): Promise<Review>;
    createIssue(params: CreateIssueParams): Promise<GitHubIssue>;
    updateIssue(params: UpdateIssueParams): Promise<GitHubIssue>;
    createIssueComment(params: CreateIssueCommentParams): Promise<{
        id: number;
        body: string;
        created_at: string;
        user: {
            login: string;
            avatar_url: string;
        };
    }>;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=client.d.ts.map