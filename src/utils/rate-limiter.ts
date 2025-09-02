import { createLogger } from './logger';

const logger = createLogger('RateLimiter');

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

export class RateLimiter {
  private requests: number[] = [];
  private readonly limit = 5000;
  private readonly window = 3600000;
  private rateLimitInfo: RateLimitInfo | null = null;
  private retryAfter: Date | null = null;

  async acquire(): Promise<void> {
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

  updateFromHeaders(headers: Record<string, string | undefined>): void {
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

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  async withBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    backoffMultiplier: number = 2
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.acquire();
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
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