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

/**
 * Rate limiter middleware, use:
 * - user email if available
 * - user ip otherwise
 * @param rateLimitedQuery
 * @param options
 * @returns
 */
export function graphqlRateLimiterMiddleware(
  rateLimitedQuery: GqlQueryKey,
  options: Options
) {
  return graphqlSpecificQueryHandlerMiddleware(
    rateLimitedQuery,
    rateLimiterMiddleware({
      windowMs: options.windowMs,
      maxRequestsPerWindow: options.maxRequestsPerWindow,
      keyGenerator: (ip: string, req) => {
        return `gql_${rateLimitedQuery}_${req?.user?.email ?? ip}`;
      }
    })
  );
}
