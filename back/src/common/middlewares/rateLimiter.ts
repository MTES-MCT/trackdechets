import rateLimit from "express-rate-limit";
import { Request } from "express";
import RateLimitRedisStore from "rate-limit-redis";
import { redisClient } from "../../common/redis";

type Options = {
  windowMs: number;
  maxRequestsPerWindow: number;
  keyGenerator?: (ip: string, request: Request) => string;
};

const RATE_LIMIT_WINDOW_SECONDS = 60;
const store =
  process.env.NODE_ENV === "test"
    ? undefined // Default memory store is used for tests
    : new RateLimitRedisStore({
        client: redisClient,
        expiry: RATE_LIMIT_WINDOW_SECONDS
      });

export function rateLimiterMiddleware(options: Options) {
  const keyGenerator = options.keyGenerator ?? (ip => ip);

  return rateLimit({
    message: `Quota de ${options.maxRequestsPerWindow} requêtes par minute excédé pour cette adresse IP, merci de réessayer plus tard.`,
    windowMs: options.windowMs,
    max: options.maxRequestsPerWindow,
    store,
    keyGenerator: (request: Request) => {
      return keyGenerator(request.ip ?? "no-ip", request);
    }
  });
}
