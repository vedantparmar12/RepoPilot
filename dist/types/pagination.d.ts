export interface PaginationContext {
    pr_number: number;
    owner: string;
    repo: string;
    current_file_index: number;
    current_chunk_index: number;
    total_files: number;
    total_chunks: number;
    session_id: string;
    filename?: string;
    cached_summary?: string;
    created_at: number;
    ttl_minutes: number;
}
export interface PagedResponse<T> {
    data: T;
    pagination: {
        has_next: boolean;
        has_previous: boolean;
        current_page: number;
        total_pages: number;
        context_token: string;
    };
}
export interface ChunkMetadata {
    file_index: number;
    chunk_index: number;
    total_chunks: number;
    lines_start: number;
    lines_end: number;
    estimated_tokens: number;
}
export declare function encryptContext(context: Partial<PaginationContext>, ttl_minutes?: number): string;
export declare function decryptContext(token: string): PaginationContext;
//# sourceMappingURL=pagination.d.ts.map