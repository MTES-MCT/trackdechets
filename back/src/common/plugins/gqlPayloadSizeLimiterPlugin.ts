import { ApolloServerPlugin } from "@apollo/server";
import { GraphQLContext } from "../../types";
import type { MutationResolvers, QueryResolvers } from "@td/codegen-back";
import { UserInputError } from "../errors";

type GqlQueryKey = keyof QueryResolvers | keyof MutationResolvers;

const MB = 1024 * 1024;
const DEFAULT_LIMIT = 2 * MB;
// If you want a limit higher than 21mb, you'll also have to modify
// app.use(json({ limit: "21mb" })); in server.ts
const OPERATIONS_LIMIT: Partial<Record<GqlQueryKey, number>> = {
  addToSsdRegistry: 20 * MB,
  addToIncomingWasteRegistry: 20 * MB,
  addToIncomingTexsRegistry: 20 * MB,
  addToOutgoingTexsRegistry: 20 * MB,
  addToOutgoingWasteRegistry: 20 * MB,
  addToTransportedRegistry: 20 * MB,
  addToManagedRegistry: 20 * MB
};

export function gqlPayloadSizeLimiterPlugin(): ApolloServerPlugin<GraphQLContext> {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation(requestContext) {
          const { req } = requestContext.contextValue;

          // Extract the query / mutation operation name
          const operationName =
            requestContext?.contextValue?.req?.gqlInfos?.[0]?.name;

          // Calculate the payload size
          const payloadSize = Buffer.byteLength(
            JSON.stringify(req.body || {}),
            "utf8"
          );

          // Determine the payload size limit for the operation
          let limit = DEFAULT_LIMIT;
          if (operationName) {
            limit =
              OPERATIONS_LIMIT[operationName as GqlQueryKey] || DEFAULT_LIMIT;
          }

          // Enforce the payload size limit
          if (payloadSize > limit) {
            throw new UserInputError(
              `Payload size for operation "${operationName}" exceeds the limit of ${(
                limit / MB
              ).toFixed(2)} MB. Actual size: ${(payloadSize / MB).toFixed(
                2
              )} MB.`
            );
          }
        }
      };
    }
  };
}
