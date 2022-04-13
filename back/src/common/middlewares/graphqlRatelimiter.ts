import rateLimit from "express-rate-limit";
import {
  MutationResolvers,
  QueryResolvers
} from "../../generated/graphql/types";
import { graphqlSpecificQueryHandlerMiddleware } from "./graphqlSpecificQueryHandler";

type AllowedQueries = keyof QueryResolvers | keyof MutationResolvers;
type Options = {
  store: rateLimit.Store;
  windowMs: number;
  maxRequestsPerWindow: number;
};

export function graphqlRateLimiterMiddleware(
  rateLimitedQuery: AllowedQueries,
  options: Options
) {
  return graphqlSpecificQueryHandlerMiddleware(
    rateLimitedQuery,
    rateLimit({
      message: `Quota de ${options.maxRequestsPerWindow} requêtes par minute excédée pour cette requête et adresse IP, merci de réessayer plus tard.`,
      windowMs: options.windowMs,
      max: options.maxRequestsPerWindow,
      store: options.store,
      keyGenerator: req => {
        if (!req.ip) {
          throw new Error(
            "express-rate-limit: req.ip is undefined - are you sure you're using express?"
          );
        }
        return `gql_${rateLimitedQuery}_${req.ip}`;
      }
    })
  );
}
