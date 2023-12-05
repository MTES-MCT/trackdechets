import { BsffOperationCode, BsffType } from "codegen-ui";

export const OPERATION: Record<
  BsffOperationCode,
  { code: BsffOperationCode; description: string; successors: BsffType[] }
> = {
  [BsffOperationCode.R1]: {
    code: BsffOperationCode.R1,
    description:
      "Utilisation principale comme combustible ou autre moyen de produire de l'énergie",
    successors: []
  },
  [BsffOperationCode.R2]: {
    code: BsffOperationCode.R2,
    description: "Récupération ou régénération des solvants",
    successors: []
  },
  [BsffOperationCode.R3]: {
    code: BsffOperationCode.R3,
    description:
      "Recyclage ou récupération des substances organiques qui ne sont pas utilisées comme solvants (y compris les opérations de compostage et autres transformations biologiques)",
    successors: []
  },
  [BsffOperationCode.R5]: {
    code: BsffOperationCode.R5,
    description: "Recyclage ou récupération d’autres matières inorganiques",
    successors: []
  },
  [BsffOperationCode.R12]: {
    code: BsffOperationCode.R12,
    description:
      "Échange de déchets en vue de les soumettre à l'une des opérations numérotées R1 à R11",
    successors: [BsffType.Groupement, BsffType.Reconditionnement]
  },
  [BsffOperationCode.R13]: {
    code: BsffOperationCode.R13,
    description:
      "Stockage de déchets préalablement à l’une des opérations R1 à R12 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production).",
    successors: [BsffType.Reexpedition]
  },
  [BsffOperationCode.D10]: {
    code: BsffOperationCode.D10,
    description: "Incinération à terre",
    successors: []
  },
  [BsffOperationCode.D13]: {
    code: BsffOperationCode.D13,
    description:
      "Regroupement préalablement à l'une des opérations numérotées D1 à D12",
    successors: [BsffType.Groupement]
  },
  [BsffOperationCode.D14]: {
    code: BsffOperationCode.D14,
    description:
      "Reconditionnement préalablement à l’une des opérations numérotées D1 à D13",
    successors: [BsffType.Reconditionnement]
  },
  [BsffOperationCode.D15]: {
    code: BsffOperationCode.D15,
    description:
      "Stockage préalablement à l’une des opérations D1 à D14 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production).",
    successors: [BsffType.Reexpedition]
  }
};

export function isFinalOperation(operationCode: string) {
  return OPERATION[operationCode]?.successors?.length === 0;
}
