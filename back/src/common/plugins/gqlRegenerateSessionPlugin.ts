import { ApolloServerPlugin } from "@apollo/server";
import { GraphQLContext } from "../../types";
import logger from "../../logging/logger";
import { MutationResolvers } from "../../generated/graphql/types";

type GqlQueryKey = keyof MutationResolvers;

export function gqlRegenerateSessionPlugin(
  queryKeys: GqlQueryKey[]
): ApolloServerPlugin<GraphQLContext> {
  return {
    async requestDidStart() {
      return {
        // Validation happens straight after parsing.
        // It's the first step in which the DocumentNode is available.
        async didResolveOperation(requestContext) {
          const { gqlInfos } = requestContext.contextValue.req;

          if (!gqlInfos) {
            logger.warn(
              `Missing "gqlInfos". The "gqlRegenerateSessionPlugin" plugin cannot be applied.`
            );
            return;
          }

          const names = gqlInfos.map(info => info.name);

          const promises = queryKeys.map(queryKey => {
            if (names.includes(queryKey)) {
              const { req, res } = requestContext.contextValue;
              const currentSession = req.session;

              return new Promise<void>(resolve =>
                req.session.regenerate(regenerateError => {
                  if (regenerateError) {
                    res
                      .status(500)
                      .send("Error while regenerating the session.");
                  }

                  Object.assign(req.session, currentSession);
                  req.session.save(saveError => {
                    if (saveError) {
                      res
                        .status(500)
                        .send("Error while saving session after regenerate.");
                    }

                    resolve();
                  });
                })
              );
            }
          });
          await Promise.all(promises);
        }
      };
    }
  };
}
