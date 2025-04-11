import { Request, Response, NextFunction } from "express";
import { FieldNode, OperationDefinitionNode, parse } from "graphql";
import { MutationResolvers, QueryResolvers } from "@td/codegen-back";

const MB = 1024 * 1024;

const formatSize = (size: number) => {
  if (size >= MB) {
    return `${(size / MB).toFixed(2)} MB`;
  }
  return `${(size / 1024).toFixed(2)} KB`;
};

const DEFAULT_LIMIT = 2 * MB;
const OPERATIONS_LIMIT: Partial<
  Record<keyof QueryResolvers | keyof MutationResolvers, number>
> = {
  // Custom limits for specific operations
  addToSsdRegistry: 20 * MB,
  addToIncomingWasteRegistry: 20 * MB,
  addToIncomingTexsRegistry: 20 * MB,
  addToOutgoingTexsRegistry: 20 * MB,
  addToOutgoingWasteRegistry: 20 * MB,
  addToTransportedRegistry: 20 * MB,
  addToManagedRegistry: 20 * MB
};

export function payloadSizeLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const payloadSize = Buffer.byteLength(JSON.stringify(req.body), "utf8");

  try {
    // Should be parsed by the graphqlBodyParser middleware
    const query = req.body?.query;

    if (query) {
      const parsedQuery = parse(query);
      const operationDefinition = parsedQuery.definitions.find(
        def => def.kind === "OperationDefinition"
      ) as OperationDefinitionNode;

      const fieldSelectionSet =
        operationDefinition?.selectionSet.selections.find(
          selection => selection.kind === "Field"
        ) as FieldNode;

      const actualOperationName = fieldSelectionSet?.name?.value;

      if (actualOperationName) {
        const limit = OPERATIONS_LIMIT[actualOperationName] || DEFAULT_LIMIT;

        if (payloadSize > limit) {
          return res.status(413).json({
            error: "Payload Too Large",
            message: `The payload for operation "${actualOperationName}" exceeds the limit of ${formatSize(
              limit
            )}.`
          });
        }

        next();
      }
    }
  } catch (_err) {
    //
  }

  const limit = DEFAULT_LIMIT;

  if (payloadSize > limit) {
    return res.status(413).json({
      error: "Payload Too Large",
      message: `The payload exceeds the limit of ${formatSize(limit)}`
    });
  }

  next();
}
