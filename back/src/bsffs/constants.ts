import * as Prisma from "@prisma/client";
import * as GraphQL from "../generated/graphql/types";

export const OPERATION_CODE: Record<
  GraphQL.BsffOperationCode,
  GraphQL.BsffOperationCode
> = {
  R2: "R2",
  R12: "R12",
  D10: "D10",
  D13: "D13",
  D14: "D14"
};

export const OPERATION: Record<
  GraphQL.BsffOperationCode,
  {
    code: GraphQL.BsffOperationCode;
    description: string;
    successors: GraphQL.BsffType[];
  }
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
    successors: [Prisma.BsffType.GROUPEMENT, Prisma.BsffType.RECONDITIONNEMENT]
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
    successors: [Prisma.BsffType.GROUPEMENT]
  },
  D14: {
    code: "D14",
    description:
      "Reconditionnement préalablement à l’une des opérations numérotées D1 à D13",
    successors: [Prisma.BsffType.RECONDITIONNEMENT]
  }
};

export const WASTE_CODES = ["14 06 01*"];
