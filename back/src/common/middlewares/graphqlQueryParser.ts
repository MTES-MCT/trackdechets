import { gql } from "graphql-tag";
import { Request, Response, NextFunction } from "express";
import { DefinitionNode, FieldNode, OperationTypeNode } from "graphql";

export type GqlInfo = { operation: OperationTypeNode; name: string };

export function graphqlQueryParserMiddleware() {
  return function graphqlQueryParser(
    req: Request,
    _: Response,
    next: NextFunction
  ) {
    const { body } = req;
    req.gqlInfos = parseGqlQuery(body?.query);

    next();
  };
}

function parseGqlQuery(query: string | undefined) {
  try {
    const parsedQuery = gql`
      ${query}
    `;

    return parsedQuery.definitions
      .flatMap(definition => parseGqlDefinition(definition))
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function parseGqlDefinition(definition: DefinitionNode) {
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
