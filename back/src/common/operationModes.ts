import { OperationMode } from "@prisma/client";
import { trim } from "./strings";

export const getOperationModesFromOperationCode = (
  operationCode: string
): OperationMode[] => {
  if (!operationCode || !operationCode.length) return [];

  // Remove all spaces in the operation code
  // In some places we use "X 0", in some other "X0"
  const trimmed = trim(operationCode);

  if (
    [
      "D1",
      "D2",
      "D3",
      "D4",
      "D5",
      "D6",
      "D7",
      "D8",
      // "D9" traitement non final
      "D9F",
      "D10",
      "D11",
      "D12"
    ].includes(trimmed)
  ) {
    return [OperationMode.ELIMINATION];
  }

  if (trimmed === "R0") {
    return [OperationMode.REUTILISATION];
  }

  if (trimmed === "R1") {
    return [OperationMode.VALORISATION_ENERGETIQUE];
  }

  if (["R2", "R3", "R4", "R5", "R7", "R9", "R11"].includes(trimmed)) {
    return [OperationMode.REUTILISATION, OperationMode.RECYCLAGE];
  }

  if (["R6", "R8", "R10"].includes(trimmed)) {
    return [OperationMode.RECYCLAGE];
  }

  // Regroupements: D13, D14, D15, R12, R13
  // D9 traitement non final
  return [];
};

export const getOperationModeLabel = (operationMode: OperationMode) => {
  switch (operationMode) {
    case OperationMode.ELIMINATION:
      return "Elimination";
    case OperationMode.RECYCLAGE:
      return "Recyclage et les autres formes de valorisation de la matière";
    case OperationMode.REUTILISATION:
      return "Réutilisation";
    case OperationMode.VALORISATION_ENERGETIQUE:
      return "Valorisation énergétique";
  }
};
