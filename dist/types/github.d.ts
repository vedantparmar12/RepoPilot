export interface PullRequest {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed' | 'merged';
    files_changed?: number;
    additions: number;
    deletions: number;
    created_at: string;
    updated_at: string;
    user: {
        login: string;
        avatar_url: string;
    };
    base: {
        ref: string;
        sha: string;
    };
    head: {
        ref: string;
        sha: string;
    };
    mergeable?: boolean | null;
    merged?: boolean;
    merged_at?: string | null;
    comments: number;
    review_comments: number;
    commits: number;
    changed_files: number;
}
export interface FileDiff {
    filename: string;
    status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
    chunks?: DiffChunk[];
    previous_filename?: string;
    blob_url: string;
    raw_url: string;
    contents_url: string;
    sha: string;
}
export interface DiffChunk {
    old_start: number;
    old_lines: number;
    new_start: number;
    new_lines: number;
    content: string;
    size_bytes: number;
    header: string;
}
export interface ReviewComment {
    id: number;
    path: string;
    line?: number;
    start_line?: number;
    original_line?: number;
    original_start_line?: number;
    side?: 'LEFT' | 'RIGHT';
    start_side?: 'LEFT' | 'RIGHT';
    body: string;
    created_at: string;
    updated_at: string;
    user: {
        login: string;
        avatar_url: string;
    };
    in_reply_to_id?: number;
}
export interface Review {
    id: number;
    body: string;
    state: 'PENDING' | 'COMMENTED' | 'APPROVED' | 'CHANGES_REQUESTED' | 'DISMISSED';
    user: {
        login: string;
        avatar_url: string;
    };
    created_at: string;
    submitted_at?: string;
}
export interface CreateReviewParams {
    owner: string;
    repo: string;
    pull_number: number;
    body?: string;
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' | 'PENDING';
    comments?: Array<{
        path: string;
        line?: number;
        start_line?: number;
        side?: 'LEFT' | 'RIGHT';
        start_side?: 'LEFT' | 'RIGHT';
        body: string;
    }>;
}
export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    user: {
        login: string;
        avatar_url: string;
    };
    assignees: Array<{
        login: string;
        avatar_url: string;
    }>;
    labels: Array<{
        name: string;
        color: string;
        description: string | null;
    }>;
    milestone?: {
        id: number;
        number: number;
        title: string;
    };
}
export interface CreateIssueParams {
    owner: string;
    repo: string;
    title: string;
    body?: string;
    assignees?: string[];
    milestone?: number;
    labels?: string[];
}
export interface UpdateIssueParams {
    owner: string;
    repo: string;
    issue_number: number;
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    state_reason?: 'completed' | 'not_planned' | 'reopened';
    assignees?: string[];
    milestone?: number | null;
    labels?: string[];
}
export interface CreateIssueCommentParams {
    owner: string;
    repo: string;
    issue_number: number;
    body: string;
}
//# sourceMappingURL=github.d.ts.map