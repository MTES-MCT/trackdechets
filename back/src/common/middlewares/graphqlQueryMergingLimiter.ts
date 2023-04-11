import {
  ApolloServerPlugin,
  GraphQLRequestContext
} from "apollo-server-plugin-base";
import { GraphQLError, OperationDefinitionNode } from "graphql";

export function graphqlQueryMergingLimiter(): ApolloServerPlugin {
  return {
    async requestDidStart(_: GraphQLRequestContext) {
      const MAX_GQL_QUERY_PER_REQUEST =
        parseInt(process.env.MAX_GQL_QUERY_PER_REQUEST, 10) ?? 10;
      return {
        async didResolveOperation(requestContext: GraphQLRequestContext) {
          const [definition] = requestContext?.document
            ?.definitions as OperationDefinitionNode[];
          const mergedQueries = definition?.selectionSet?.selections?.length;

          if (mergedQueries > MAX_GQL_QUERY_PER_REQUEST) {
            throw new GraphQLError(
              `Batching by query merging is limited to ${MAX_GQL_QUERY_PER_REQUEST} operations per query.`
            );
          }
        }
      };
    }
  };
}
