import rateLimit from "express-rate-limit";
import {
  MutationResolvers,
  QueryResolvers
} from "../../generated/graphql/types";
import { graphqlSpecificQueryHandlerMiddleware } from "./graphqlSpecificQueryHandler";
import { rateLimiterMiddleware } from "./rateLimiter";

type GqlQueryKey = keyof QueryResolvers | keyof MutationResolvers;
type Options = {
  windowMs: number;
  maxRequestsPerWindow: number;
};

export function graphqlRateLimiterMiddleware(
  rateLimitedQuery: GqlQueryKey,
  options: Options
) {
  return graphqlSpecificQueryHandlerMiddleware(
    rateLimitedQuery,
    rateLimiterMiddleware({
      windowMs: options.windowMs,
      maxRequestsPerWindow: options.maxRequestsPerWindow,
      keyGenerator: (ip: string) => `gql_${rateLimitedQuery}_${ip}`
    })
  );
}
