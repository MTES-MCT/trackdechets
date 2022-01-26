import { redisClient, setInCache } from "../../common/redis";
import { TooManyRequestsError } from "../../common/errors";

function throttleErrorMessage(apiType: string) {
  return `Trop de requêtes sur l'API Sirene ${apiType}`;
}

type BackoffDecoratorOpts = {
  service: "insee" | "data_gouv";
  expiry?: number;
};

/**
 * Back off calls to API when hitting 429 Too Many Requests
 * in order to avoid beeing blacklisted or just for courtesy
 */
export function backoffIfTooManyRequests<T>(
  fn: (...args) => Promise<T>,
  { service, expiry }: BackoffDecoratorOpts
) {
  const rateLimited = async (...args) => {
    const cacheKey = `${service}_backoff`;
    const isRateLimited = await redisClient.get(cacheKey);
    if (isRateLimited) {
      // fail fast if we know we are being rate limited
      throw new TooManyRequestsError(throttleErrorMessage(service));
    }
    try {
      const response = await fn(...args);
      return response;
    } catch (err) {
      if (err.response?.status === 429) {
        // server responded with a 429 TOO MANY REQUESTS
        // activate rate limiting cache key for a specific amout of time
        await setInCache(cacheKey, "true", { EX: expiry ?? 60 });
        throw new TooManyRequestsError(throttleErrorMessage(service));
      }
      throw err;
    }
  };
  return rateLimited;
}

type ThrottleDecoratorArgs = {
  service: "insee" | "data_gouv";
  requestsPerSeconds?: number;
};

/**
 * Throttle request made to sirene API before hitting 429
 * https://redis.io/commands/INCR
 */
export function throttle<T>(
  fn: (...args) => Promise<T>,
  { service, requestsPerSeconds = 10 }: ThrottleDecoratorArgs
) {
  const throttled = async (...args) => {
    const now = Date.now();
    console.log(now);
    const secondsSinceEpoch = Math.round(now / 1000);
    const cacheKey = `${service}_throttle_${secondsSinceEpoch}`;
    console.log(cacheKey);
    const responses = await redisClient
      .multi()
      .incr(cacheKey)
      .expire(cacheKey, 1)
      .exec();
    const counter = responses[0][1];
    if (counter > requestsPerSeconds) {
      throw new TooManyRequestsError(throttleErrorMessage(service));
    }
    return fn(...args);
  };

  return throttled;
}
