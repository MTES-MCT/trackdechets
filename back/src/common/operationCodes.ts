import { trim } from "./strings";

export const FINAL_OPERATION_CODES = [
  "R 0",
  "R 1",
  "R 2",
  "R 3",
  "R 4",
  "R 5",
  "R 6",
  "R 7",
  "R 8",
  "R 9",
  "R 10",
  "R 11",
  // "R 12",
  // "R 13",
  "D 1",
  "D 2",
  "D 3",
  "D 4",
  "D 5",
  "D 6",
  "D 7",
  "D 8",
  // "D 9",
  "D 9 F",
  "D 10",
  "D 12"
  // "D 13",
  // "D 14",
  // "D 15"
];
export const TRIMMED_FINAL_OPERATION_CODES = FINAL_OPERATION_CODES.map(trim);

export const isFinalOperationCode = (operationCode: string | null): boolean => {
  if (!operationCode) return false;

  const trimmedOperationCode = trim(operationCode);
  return TRIMMED_FINAL_OPERATION_CODES.includes(trimmedOperationCode);
};
