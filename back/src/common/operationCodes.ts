export const FINAL_OPERATION_CODES = [
  "R0",
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
  "R9",
  "R10",
  "R11",
  "D1",
  "D2",
  "D3",
  "D4",
  "D5",
  "D6",
  "D7",
  "D8",
  "D9F",
  "D10",
  "D12",
  "D15"
];

export const isFinalOperationCode = (operationCode: string | null): boolean => {
  if (!operationCode) return false;

  const trimmedOperationCode = operationCode.replace(/ /g, "").toString();
  return FINAL_OPERATION_CODES.includes(trimmedOperationCode);
};
