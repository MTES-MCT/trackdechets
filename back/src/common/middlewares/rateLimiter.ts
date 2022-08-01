import rateLimit from "express-rate-limit";
import { Request } from "express";
import forwarded from "forwarded";
import RateLimitRedisStore from "rate-limit-redis";
import { redisClient } from "../../common/redis";

type Options = {
  windowMs: number;
  maxRequestsPerWindow: number;
  keyGenerator?: (ip: string, request: Request) => string;
};

const { USE_XFF_HEADER } = process.env;

const RATE_LIMIT_WINDOW_SECONDS = 60;
const store =
  process.env.NODE_ENV === "test"
    ? undefined // Default memory store is used for tests
    : new RateLimitRedisStore({
        client: redisClient,
        expiry: RATE_LIMIT_WINDOW_SECONDS
      });

export function rateLimiterMiddleware(options: Options) {
  options.keyGenerator = options.keyGenerator ?? (ip => ip);

  return rateLimit({
    message: `Quota de ${options.maxRequestsPerWindow} requêtes par minute excédé pour cette adresse IP, merci de réessayer plus tard.`,
    windowMs: options.windowMs,
    max: options.maxRequestsPerWindow,
    store,
    keyGenerator: (request: Request) => {
      const clientIp = getClientIp(request);
      return options.keyGenerator(clientIp, request);
    }
  });
}

function getClientIp(request: Request) {
  if (USE_XFF_HEADER !== "true") {
    return request.ip;
  }

  const parsed = forwarded(request);
  return parsed.slice(-1).pop() ?? request.ip;
}
