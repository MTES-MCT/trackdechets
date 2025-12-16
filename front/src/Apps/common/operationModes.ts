import { OperationMode } from "@td/codegen-ui";

export const getOperationModeLabel = (operationMode?: OperationMode) => {
  switch (operationMode) {
    case OperationMode.Elimination:
      return "Elimination";
    case OperationMode.Recyclage:
      return "Recyclage et les autres formes de valorisation de la matière";
    case OperationMode.Reutilisation:
      return "Réutilisation";
    case OperationMode.ValorisationEnergetique:
      return "Valorisation énergétique";
    case OperationMode.AutresValorisations:
      return "Autres valorisations";
    default:
      return "";
  }
};
