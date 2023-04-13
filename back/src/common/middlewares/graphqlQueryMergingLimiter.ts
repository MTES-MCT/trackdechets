import {
  ApolloServerPlugin,
  GraphQLRequestContext
} from "apollo-server-plugin-base";
import { OperationDefinitionNode } from "graphql";
import { MAX_OPERATIONS_PER_REQUEST } from "./graphqlBatchLimiter";
import { ErrorCode } from "../errors";
import { ApolloError } from "apollo-server-core";

export class GraphqlQueryLimit extends ApolloError {
  constructor(message: string) {
    super(message, ErrorCode.GRAPHQL_MAX_OPERATIONS_ERROR);

    Object.defineProperty(this, "name", {
      value: "GraphqlQueryLimit"
    });
  }
}

export function graphqlQueryMergingLimiter(): ApolloServerPlugin {
  return {
    async requestDidStart(_: GraphQLRequestContext) {
      return {
        async didResolveOperation(requestContext: GraphQLRequestContext) {
          const [definition] = requestContext?.document
            ?.definitions as OperationDefinitionNode[];
          const mergedQueries = definition?.selectionSet?.selections?.length;

          if (mergedQueries > MAX_OPERATIONS_PER_REQUEST) {
            throw new GraphqlQueryLimit(
              `Batching by query merging is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per query.`,
            );
          }
        }
      };
    }
  };
}
