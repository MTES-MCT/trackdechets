import { OperationMode } from "@td/codegen-ui";

export const getOperationModesFromOperationCode = (
  operationCode: string
): OperationMode[] => {
  if (!operationCode || !operationCode.length) return [];

  // Remove all spaces in the operation code
  // In some places we use "X 0", in some other "X0"
  const trimmed = operationCode.replace(/ /g, "").toString();

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
      // "D9", non final
      "D9F",
      "D10",
      "D11",
      "D12"
    ].includes(trimmed)
  ) {
    return [OperationMode.Elimination];
  }

  if (trimmed === "R0") {
    return [OperationMode.Reutilisation];
  }

  if (trimmed === "R1") {
    return [OperationMode.ValorisationEnergetique];
  }

  if (["R2", "R3", "R4", "R5", "R7", "R9", "R11"].includes(trimmed)) {
    return [OperationMode.Reutilisation, OperationMode.Recyclage];
  }

  if (["R6", "R8", "R10"].includes(trimmed)) {
    return [OperationMode.Recyclage];
  }

  // Regroupements: D13, D14, D15, R12, R13 and D9
  return [];
};

export const getOperationModeLabel = (operationMode: OperationMode) => {
  switch (operationMode) {
    case OperationMode.Elimination:
      return "Elimination";
    case OperationMode.Recyclage:
      return "Recyclage et les autres formes de valorisation de la matière";
    case OperationMode.Reutilisation:
      return "Réutilisation";
    case OperationMode.ValorisationEnergetique:
      return "Valorisation énergétique";
  }
};
