import { redisClient, setInCache } from "../../common/redis";
import { TooManyRequestsError } from "../../common/errors";

type ThrottledDecoratorOpts = {
  cacheKey: string;
  errorMessage: string;
  expiry?: number;
};

/**
 * Throttle API calls in case we hit rate limit
 */
export function throttle<T>(
  fn: (...args) => Promise<T>,
  { cacheKey, errorMessage, expiry }: ThrottledDecoratorOpts
) {
  const rateLimited = async (...args) => {
    const isRateLimited = await redisClient.get(cacheKey);
    if (isRateLimited) {
      // fail fast if we know we are being rate limited
      // to prevent our API from being blacklisted
      throw new TooManyRequestsError(errorMessage);
    }
    try {
      const response = await fn(...args);
      return response;
    } catch (err) {
      if (err.response?.status === 429) {
        // server responded with a 429 TOO MANY REQUESTS
        // activate rate limiting cache key for a specific amout of time
        await setInCache(cacheKey, "true", { EX: expiry ?? 60 });
        throw new TooManyRequestsError(errorMessage);
      }
      throw err;
    }
  };
  return rateLimited;
}
