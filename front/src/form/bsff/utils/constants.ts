import { BsffOperationCode, BsffType } from "generated/graphql/types";

export const OPERATION: Record<
  BsffOperationCode,
  { code: BsffOperationCode; description: string; successors: BsffType[] }
> = {
  [BsffOperationCode.R2]: {
    code: BsffOperationCode.R2,
    description: "Récupération ou régénération des solvants",
    successors: [],
  },
  [BsffOperationCode.R12]: {
    code: BsffOperationCode.R12,
    description:
      "Échange de déchets en vue de les soumettre à l'une des opérations numérotées R1 à R11",
    successors: [BsffType.Groupement, BsffType.Reconditionnement],
  },
  [BsffOperationCode.D10]: {
    code: BsffOperationCode.D10,
    description: "Incinération à terre",
    successors: [],
  },
  [BsffOperationCode.D13]: {
    code: BsffOperationCode.D13,
    description:
      "Regroupement préalablement à l'une des opérations numérotées D1 à D12",
    successors: [BsffType.Groupement],
  },
  [BsffOperationCode.D14]: {
    code: BsffOperationCode.D14,
    description:
      "Reconditionnement préalablement à l’une des opérations numérotées D1 à D13",
    successors: [BsffType.Reconditionnement],
  },
};
