import * as Prisma from "@prisma/client";
import * as GraphQL from "../generated/graphql/types";

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
  R3: {
    code: "R3",
    description:
      "Recyclage ou récupération des substances organiques qui ne sont pas utilisées comme solvants (y compris les opérations de compostage et autres transformations biologiques)",
    successors: []
  },
  R5: {
    code: "R5",
    description: "Recyclage ou récupération d’autres matières inorganiques",
    successors: []
  },
  R12: {
    code: "R12",
    description:
      "Échange de déchets en vue de les soumettre à l'une des opérations numérotées R1 à R11",
    successors: [Prisma.BsffType.GROUPEMENT, Prisma.BsffType.RECONDITIONNEMENT]
  },
  R13: {
    code: "R13",
    description:
      "Stockage de déchets préalablement à l’une des opérations R1 à R12 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production).",
    successors: [Prisma.BsffType.REEXPEDITION]
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
  },
  D15: {
    code: "D15",
    description:
      "Stockage préalablement à l’une des opérations D1 à D14 (à l’exclusion du stockage temporaire, avant collecte, sur le site de production).",
    successors: [Prisma.BsffType.REEXPEDITION]
  }
};

export function isFinalOperation(
  operationCode: string,
  noTraceability = false
) {
  return OPERATION[operationCode]?.successors?.length === 0 || noTraceability;
}
