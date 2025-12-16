import rateLimit from "express-rate-limit";
import { Request } from "express";
import RateLimitRedisStore from "rate-limit-redis";
import { redisClient } from "../../common/redis";

type Options = {
  windowMs: number;
  maxRequestsPerWindow: number;
  keyGenerator?: (ip: string, request: Request) => string;
};

function getWindowDescription(windowMs: number): string {
  const seconds = windowMs / 1000;
  if (seconds % 86400 === 0) return `${seconds / 86400} jour(s)`;
  if (seconds % 3600 === 0) return `${seconds / 3600} heure(s)`;
  if (seconds % 60 === 0) return `${seconds / 60} minute(s)`;
  return `${seconds} seconde(s)`;
}

function createStore(windowMs: number) {
  if (process.env.NODE_ENV === "test") return undefined;
  return new RateLimitRedisStore({
    client: redisClient,
    expiry: Math.ceil(windowMs / 1000)
  });
}

export function rateLimiterMiddleware(options: Options) {
  const keyGenerator = options.keyGenerator ?? (ip => ip);
  const windowDesc = getWindowDescription(options.windowMs);

  return rateLimit({
    message: `Quota de ${options.maxRequestsPerWindow} requêtes par ${windowDesc} excédé pour cette adresse IP, merci de réessayer plus tard.`,
    windowMs: options.windowMs,
    max: options.maxRequestsPerWindow,
    store: createStore(options.windowMs),
    keyGenerator: (request: Request) => {
      return keyGenerator(request.ip ?? "no-ip", request);
    }
  });
}
