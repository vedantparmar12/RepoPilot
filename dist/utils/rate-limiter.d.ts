interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: Date;
    used: number;
}
export declare class RateLimiter {
    private requests;
    private readonly limit;
    private readonly window;
    private rateLimitInfo;
    private retryAfter;
    acquire(): Promise<void>;
    updateFromHeaders(headers: Record<string, string | undefined>): void;
    getRateLimitInfo(): RateLimitInfo | null;
    withBackoff<T>(fn: () => Promise<T>, maxRetries?: number, backoffMultiplier?: number): Promise<T>;
}
export {};
//# sourceMappingURL=rate-limiter.d.ts.map