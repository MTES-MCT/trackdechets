import { OperationMode } from "@td/codegen-ui";

/**
 * Documentation: https://app.gitbook.com/o/-LxvsGVFUcY-b40HZcJs/s/bOGR2l18BC74rMQs4CWK/~/changes/2/general/codes-de-traitement
 */
export const CODES_AND_EXPECTED_OPERATION_MODES = {
  // Opérations d'élimination
  D1: [OperationMode.Elimination],
  D2: [OperationMode.Elimination],
  D3: [OperationMode.Elimination],
  D4: [OperationMode.Elimination],
  D5: [OperationMode.Elimination],
  // "D6": Interdit en France
  D7: [OperationMode.Elimination],
  D8: [OperationMode.Elimination],
  D9: [],
  D9F: [OperationMode.Elimination],
  D10: [OperationMode.Elimination],
  D11: [OperationMode.Elimination],
  D12: [OperationMode.Elimination],
  D13: [],
  D14: [],
  D15: [],

  // Opérations de valorisation
  R0: [OperationMode.Reutilisation],
  R1: [OperationMode.ValorisationEnergetique],
  R2: [OperationMode.Reutilisation, OperationMode.Recyclage],
  R3: [OperationMode.Recyclage, OperationMode.AutresValorisations],
  R4: [OperationMode.Recyclage],
  R5: [OperationMode.Recyclage, OperationMode.AutresValorisations],
  R6: [OperationMode.Recyclage],
  R7: [OperationMode.Reutilisation],
  R8: [OperationMode.Recyclage],
  R9: [
    OperationMode.Reutilisation,
    OperationMode.Recyclage,
    OperationMode.ValorisationEnergetique
  ],
  R10: [OperationMode.Recyclage],
  R11: [
    OperationMode.Recyclage,
    OperationMode.AutresValorisations,
    OperationMode.ValorisationEnergetique
  ],
  R12: [],
  R13: []
};

export const getOperationModesFromOperationCode = (
  operationCode: string
): OperationMode[] => {
  if (!operationCode || !operationCode.length) return [];

  // Remove all spaces in the operation code
  // In some places we use "X 0", in some other "X0"
  const trimmed = operationCode.replace(/ /g, "").toString();

  return CODES_AND_EXPECTED_OPERATION_MODES[trimmed] || [];
};

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
