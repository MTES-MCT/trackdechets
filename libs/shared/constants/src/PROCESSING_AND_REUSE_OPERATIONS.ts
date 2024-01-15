import {
  PROCESSING_OPERATIONS,
  ProcessingOperation,
  ProcessingOperationType
} from "./PROCESSING_OPERATIONS";

export const PROCESSING_AND_REUSE_OPERATIONS: ProcessingOperation[] = [
  {
    type: ProcessingOperationType.Valorisation,
    code: "R 0",
    description: "Réutilisation - réemploi"
  },
  ...PROCESSING_OPERATIONS
];

export const PROCESSING_AND_REUSE_OPERATIONS_CODES: string[] =
  PROCESSING_AND_REUSE_OPERATIONS.map(operation => operation.code);
