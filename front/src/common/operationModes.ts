import { OperationMode } from "generated/graphql/types";

export const getOperationModesFromOperationCode = (
  operationCode: string
): OperationMode[] => {
  const splitted = operationCode.split(" ");
  const letter = splitted[0];
  const number = parseInt(splitted[1]);

  if (letter === "D" && number <= 12) {
    return [OperationMode.Elimination];
  }

  if (operationCode === "R 1") {
    return [OperationMode.ValorisationEnergetique];
  }

  if (
    ["R 2", "R 3", "R 4", "R 5", "R 7", "R 9", "R 11"].includes(operationCode)
  ) {
    return [OperationMode.Reutilisation, OperationMode.Recyclage];
  }

  if (["R 6", "R 8", "R 10"].includes(operationCode)) {
    return [OperationMode.Recyclage];
  }

  // Regroupements: D13, D14, D15, R12, R13
  return [];
};

export const getOperationModeLabel = (processingMode: OperationMode) => {
  switch (processingMode) {
    case OperationMode.Elimination:
      return "Elimination (incinération sans valorisation énergétique et stockage en décharge)";
    case OperationMode.Recyclage:
      return "Recyclage et les autres formes de valorisation de la matière";
    case OperationMode.Reutilisation:
      return "Réutilisation";
    case OperationMode.ValorisationEnergetique:
      return "Valorisation énergétique";
  }
};
