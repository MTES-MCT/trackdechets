import {
  BSDA_FINAL_OPERATION_CODES,
  FINAL_OPERATION_CODES
} from "@td/constants";
import { trim } from "./strings";

export const TRIMMED_FINAL_OPERATION_CODES = FINAL_OPERATION_CODES.map(trim);

export const isFinalOperationCode = (operationCode: string | null): boolean => {
  if (!operationCode) return false;

  const trimmedOperationCode = trim(operationCode);
  return TRIMMED_FINAL_OPERATION_CODES.includes(trimmedOperationCode);
};

export const TRIMMED_BSDA_FINAL_OPERATION_CODES =
  BSDA_FINAL_OPERATION_CODES.map(trim);
export const isBSDAFinalOperationCode = (
  operationCode: string | null
): boolean => {
  if (!operationCode) return false;

  const trimmedOperationCode = trim(operationCode);

  return TRIMMED_BSDA_FINAL_OPERATION_CODES.includes(trimmedOperationCode);
};
