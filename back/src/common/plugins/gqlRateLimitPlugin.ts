import { ApolloServerPlugin } from "@apollo/server";
import { GraphQLContext } from "../../types";
import { logger } from "@td/logger";
import type { MutationResolvers, QueryResolvers } from "@td/codegen-back";
import { rateLimiterMiddleware } from "../middlewares/rateLimiter";
import rateLimit from "express-rate-limit";

type GqlQueryKey = keyof QueryResolvers | keyof MutationResolvers;
type Options = {
  windowMs: number;
  maxRequestsPerWindow: number;
};
type GqlRateLimitingRules = Partial<Record<GqlQueryKey, Options>>;

export function gqlRateLimitPlugin(
  rules: GqlRateLimitingRules
): ApolloServerPlugin<GraphQLContext> {
  const rateLimitersArray = Object.entries(rules).map<
    [string, rateLimit.RateLimit]
  >(([queryKey, options]) => {
    return [
      queryKey,
      rateLimiterMiddleware({
        windowMs: options.windowMs,
        maxRequestsPerWindow: options.maxRequestsPerWindow,
        keyGenerator: (ip: string, req) => {
          return `gql_${queryKey}_${req?.user?.email ?? ip}`;
        }
      })
    ];
  });
  const rateLimiters = Object.fromEntries(rateLimitersArray);

  return {
    async requestDidStart() {
      return {
        // Validation happens straight after parsing.
        // It's the first step in which the DocumentNode is available.
        async didResolveOperation(requestContext) {
          const { gqlInfos } = requestContext.contextValue.req;
          if (!gqlInfos) {
            logger.warn(
              `Missing "gqlInfos". The "gqlRateLimitPlugin" plugin cannot be applied.`
            );
            return;
          }

          const operationNames = gqlInfos.map(info => info.name);
          const { req, res } = requestContext.contextValue;

          // Apply rate limiting for each operation occurrence (not just unique operations)
          for (const operationName of operationNames) {
            if (operationName in rules) {
              const rateLimiterFn = rateLimiters[operationName];
              await new Promise(resolve => rateLimiterFn(req, res, resolve));
            }
          }
        }
      };
    }
  };
}
