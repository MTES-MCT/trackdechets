import {
  PROCESSING_OPERATIONS,
  ProcessingOperationType
} from "./PROCESSING_OPERATIONS";

export const PROCESSING_AND_REUSE_OPERATIONS = [
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 0",
    description: "Réutilisation - réemploi"
  },
  ...PROCESSING_OPERATIONS
] as const;

export const PROCESSING_AND_REUSE_OPERATIONS_SIGNATURE =
  PROCESSING_AND_REUSE_OPERATIONS.filter(op => op.code !== "D 6").filter(
    op => op.code !== "D 7"
  );

export const PROCESSING_AND_REUSE_OPERATIONS_CODES: string[] =
  PROCESSING_AND_REUSE_OPERATIONS.map(operation => operation.code);
