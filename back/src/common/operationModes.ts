import { OperationMode } from "@td/prisma";

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
    case OperationMode.AUTRES_VALORISATIONS:
      return "Autres valorisations";
  }
};
