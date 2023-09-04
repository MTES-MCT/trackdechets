import { OperationMode } from "@prisma/client";

export const getOperationModesFromOperationCode = (
  operationCode: string
): OperationMode[] => {
  const splitted = operationCode.split(" ");
  const letter = splitted[0];
  const number = parseInt(splitted[1]);

  if (letter === "D" && number <= 12) {
    return [OperationMode.ELIMINATION];
  }

  if (operationCode === "R 1") {
    return [OperationMode.VALORISATION_ENERGETIQUE];
  }

  if (
    ["R 2", "R 3", "R 4", "R 5", "R 7", "R 9", "R 11"].includes(operationCode)
  ) {
    return [OperationMode.REUTILISATION, OperationMode.RECYCLAGE];
  }

  if (["R 6", "R 8", "R 10"].includes(operationCode)) {
    return [OperationMode.RECYCLAGE];
  }

  // Regroupements: D13, D14, D15, R12, R13
  return [];
};

export const getOperationModeLabel = (operationMode: OperationMode) => {
  switch (operationMode) {
    case OperationMode.ELIMINATION:
      return "Elimination (incinération sans valorisation énergétique et stockage en décharge)";
    case OperationMode.RECYCLAGE:
      return "Recyclage et les autres formes de valorisation de la matière";
    case OperationMode.REUTILISATION:
      return "Réutilisation";
    case OperationMode.VALORISATION_ENERGETIQUE:
      return "Valorisation énergétique";
  }
};
