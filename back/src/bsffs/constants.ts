import { BsffType, BsffOperationCode } from "../generated/graphql/types";

export const BSFF_TYPE: Record<BsffType, BsffType> = {
  TRACER_FLUIDE: "TRACER_FLUIDE",
  COLLECTE_PETITES_QUANTITES: "COLLECTE_PETITES_QUANTITES",
  GROUPEMENT: "GROUPEMENT",
  RECONDITIONNEMENT: "RECONDITIONNEMENT",
  REEXPEDITION: "REEXPEDITION"
};

export const OPERATION_CODE: Record<BsffOperationCode, BsffOperationCode> = {
  R2: "R2",
  R12: "R12",
  D10: "D10",
  D13: "D13",
  D14: "D14"
};

export const OPERATION: Record<
  BsffOperationCode,
  { code: BsffOperationCode; description: string; successors: BsffType[] }
> = {
  R2: {
    code: "R2",
    description: "Récupération ou régénération des solvants",
    successors: []
  },
  R12: {
    code: "R12",
    description:
      "Échange de déchets en vue de les soumettre à l'une des opérations numérotées R1 à R11",
    successors: [BSFF_TYPE.GROUPEMENT, BSFF_TYPE.RECONDITIONNEMENT]
  },
  D10: {
    code: "D10",
    description: "Incinération à terre",
    successors: []
  },
  D13: {
    code: "D13",
    description:
      "Regroupement préalablement à l'une des opérations numérotées D1 à D12",
    successors: [BSFF_TYPE.GROUPEMENT]
  },
  D14: {
    code: "D14",
    description:
      "Reconditionnement préalablement à l’une des opérations numérotées D1 à D13",
    successors: [BSFF_TYPE.RECONDITIONNEMENT]
  }
};

export const WASTE_CODES = ["14 06 01*"];
