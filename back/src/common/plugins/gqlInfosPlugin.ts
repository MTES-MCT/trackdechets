import type { ApolloServerPlugin } from "@apollo/server";
import { DefinitionNode, FieldNode, OperationTypeNode } from "graphql";
import { ValidationError } from "yup";
import { ZodError } from "zod";
import type { GraphQLContext } from "../../types";

export type GqlInfo = { operation: OperationTypeNode; name: string };

export function gqlInfosPlugin(): ApolloServerPlugin<GraphQLContext> {
  return {
    async requestDidStart() {
      return {
        // Apollo calls parsingDidStart -> validationDidStart -> didResolveOperation
        // Because the first two are skipped if the query is already cached, we have to wait for this event to populate gqlInfos.
        async didResolveOperation(requestContext) {
          const gqlInfos = requestContext.document.definitions
            .flatMap(definition => parseGqlDefinition(definition))
            .filter(Boolean);

          requestContext.contextValue.req.gqlInfos = gqlInfos;
        },
        async didEncounterErrors(requestContext) {
          // Keep the errors on the response locals to allow middlewares to read them
          requestContext.contextValue.res.locals.hasUndisplayedError =
            requestContext.errors?.some(
              error =>
                !(error instanceof ValidationError) &&
                !(error instanceof ZodError) &&
                (!error.extensions?.code ||
                  error.extensions.code === "INTERNAL_SERVER_ERROR")
            );
          requestContext.contextValue.res.locals.gqlErrors = [
            ...requestContext.errors
          ];
        }
      };
    }
  };
}

function parseGqlDefinition(definition: DefinitionNode): GqlInfo[] | undefined {
  if (definition.kind !== "OperationDefinition") return undefined;

  const fieldSelections = definition.selectionSet.selections.filter(
    (selection): selection is FieldNode =>
      selection.kind === "Field" && selection.name.value !== "__typename"
  );

  return fieldSelections.map(field => ({
    operation: definition.operation,
    name: field.name.value
  }));
}
