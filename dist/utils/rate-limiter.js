"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const logger_1 = require("./logger");
const logger = (0, logger_1.createLogger)('RateLimiter');
class RateLimiter {
    requests = [];
    limit = 5000;
    window = 3600000;
    rateLimitInfo = null;
    retryAfter = null;
    async acquire() {
        if (this.retryAfter && Date.now() < this.retryAfter.getTime()) {
            const waitTime = this.retryAfter.getTime() - Date.now();
            logger.info({ waitTime }, 'Rate limited, waiting before retry');
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.retryAfter = null;
        }
        const now = Date.now();
        this.requests = this.requests.filter(t => now - t < this.window);
        if (this.requests.length >= this.limit) {
            const oldestRequest = this.requests[0];
            const waitTime = this.window - (now - oldestRequest) + 1000;
            logger.warn({ waitTime, requestCount: this.requests.length }, 'Local rate limit reached, waiting');
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return this.acquire();
        }
        this.requests.push(now);
    }
    updateFromHeaders(headers) {
        const limit = headers['x-ratelimit-limit'];
        const remaining = headers['x-ratelimit-remaining'];
        const reset = headers['x-ratelimit-reset'];
        const used = headers['x-ratelimit-used'];
        const retryAfter = headers['retry-after'];
        if (limit && remaining && reset) {
            this.rateLimitInfo = {
                limit: parseInt(limit),
                remaining: parseInt(remaining),
                reset: new Date(parseInt(reset) * 1000),
                used: parseInt(used || '0')
            };
            logger.debug({
                rateLimit: this.rateLimitInfo
            }, 'Rate limit updated from headers');
            if (this.rateLimitInfo.remaining < 100) {
                logger.warn({
                    remaining: this.rateLimitInfo.remaining,
                    reset: this.rateLimitInfo.reset
                }, 'Low rate limit remaining');
            }
        }
        if (retryAfter) {
            const retrySeconds = parseInt(retryAfter);
            this.retryAfter = new Date(Date.now() + retrySeconds * 1000);
            logger.info({ retryAfter: this.retryAfter }, 'Retry-After header received');
        }
    }
    getRateLimitInfo() {
        return this.rateLimitInfo;
    }
    async withBackoff(fn, maxRetries = 3, backoffMultiplier = 2) {
        let lastError;
        let delay = 1000;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                await this.acquire();
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    logger.warn({
                        attempt,
                        maxRetries,
                        delay,
                        error: lastError.message
                    }, 'Request failed, retrying with backoff');
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= backoffMultiplier;
                }
            }
        }
        logger.error({
            maxRetries,
            error: lastError?.message
        }, 'All retry attempts exhausted');
        throw lastError;
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map