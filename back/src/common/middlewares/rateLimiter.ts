import rateLimit from "express-rate-limit";
import forwarded from "forwarded";
import RateLimitRedisStore from "rate-limit-redis";
import { redisClient } from "../../common/redis";

type Options = {
  windowMs: number;
  maxRequestsPerWindow: number;
  keyGenerator?: (ip: string) => string;
};

const { USE_XFF_HEADER } = process.env;

const RATE_LIMIT_WINDOW_SECONDS = 60;
const store = new RateLimitRedisStore({
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
    keyGenerator: request => {
      // use xff data as client ip when behind a cdn
      if (USE_XFF_HEADER !== "true") {
        return request.ip;
      }
      const parsed = forwarded(request);
      const clientIp = parsed.slice(-1).pop() ?? request.ip;
      return options.keyGenerator(clientIp);
    }
  });
}
