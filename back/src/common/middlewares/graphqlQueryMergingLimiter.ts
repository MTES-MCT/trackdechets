import { ApolloServerPlugin, GraphQLRequestContext } from "@apollo/server";
import { GraphQLError, Kind, OperationDefinitionNode } from "graphql";
import { MAX_OPERATIONS_PER_REQUEST } from "./graphqlBatchLimiter";
import { ErrorCode } from "../errors";

export class GraphqlQueryLimit extends GraphQLError {
  constructor(message: string) {
    super(message, {
      extensions: {
        code: ErrorCode.GRAPHQL_MAX_OPERATIONS_ERROR
      }
    });
  }
}

export function graphqlQueryMergingLimiter(): ApolloServerPlugin {
  return {
    async requestDidStart(_: GraphQLRequestContext<any>) {
      return {
        async didResolveOperation(requestContext: GraphQLRequestContext<any>) {
          const operationsDefinitions =
            requestContext?.document?.definitions.filter(
              definition => definition.kind === Kind.OPERATION_DEFINITION
            );

          const mergedQueries = (
            operationsDefinitions as OperationDefinitionNode[]
          ).reduce((accumulator, definition) => {
            const operationsLength =
              definition?.selectionSet?.selections?.length;
            if (isNaN(operationsLength)) return accumulator;
            return accumulator + operationsLength;
          }, 0);

          if (mergedQueries > MAX_OPERATIONS_PER_REQUEST) {
            throw new GraphqlQueryLimit(
              `Batching by query merging is limited to ${MAX_OPERATIONS_PER_REQUEST} operations per query.`
            );
          }
        }
      };
    }
  };
}
