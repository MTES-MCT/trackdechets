import { OperationMode } from "@prisma/client";
import { trim } from "./strings";

/**
 * Documentation: https://app.gitbook.com/o/-LxvsGVFUcY-b40HZcJs/s/bOGR2l18BC74rMQs4CWK/~/changes/2/general/codes-de-traitement
 */
export const CODES_AND_EXPECTED_OPERATION_MODES = {
  // Opérations d'élimination
  D1: [OperationMode.ELIMINATION],
  D2: [OperationMode.ELIMINATION],
  D3: [OperationMode.ELIMINATION],
  D4: [OperationMode.ELIMINATION],
  D5: [OperationMode.ELIMINATION],
  // "D6": Interdit en France
  D7: [OperationMode.ELIMINATION],
  D8: [OperationMode.ELIMINATION],
  D9: [],
  D9F: [OperationMode.ELIMINATION],
  D10: [OperationMode.ELIMINATION],
  D11: [OperationMode.ELIMINATION],
  D12: [OperationMode.ELIMINATION],
  D13: [],
  D14: [],
  D15: [],

  // Opérations de valorisation
  R0: [OperationMode.REUTILISATION],
  R1: [OperationMode.VALORISATION_ENERGETIQUE],
  R2: [
    OperationMode.REUTILISATION,
    OperationMode.RECYCLAGE,
    OperationMode.AUTRES_VALORISATIONS
  ],
  R3: [
    OperationMode.REUTILISATION,
    OperationMode.RECYCLAGE,
    OperationMode.AUTRES_VALORISATIONS
  ],
  R4: [
    OperationMode.REUTILISATION,
    OperationMode.RECYCLAGE,
    OperationMode.AUTRES_VALORISATIONS
  ],
  R5: [
    OperationMode.REUTILISATION,
    OperationMode.RECYCLAGE,
    OperationMode.AUTRES_VALORISATIONS
  ],
  R6: [OperationMode.RECYCLAGE, OperationMode.AUTRES_VALORISATIONS],
  R7: [OperationMode.RECYCLAGE, OperationMode.AUTRES_VALORISATIONS],
  R8: [OperationMode.RECYCLAGE, OperationMode.AUTRES_VALORISATIONS],
  R9: [
    OperationMode.REUTILISATION,
    OperationMode.RECYCLAGE,
    OperationMode.AUTRES_VALORISATIONS
  ],
  R10: [OperationMode.AUTRES_VALORISATIONS],
  R11: [
    OperationMode.REUTILISATION,
    OperationMode.RECYCLAGE,
    OperationMode.AUTRES_VALORISATIONS
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
  const trimmed = trim(operationCode);

  return CODES_AND_EXPECTED_OPERATION_MODES[trimmed] || [];
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
    case OperationMode.AUTRES_VALORISATIONS:
      return "Autres valorisations";
  }
};
