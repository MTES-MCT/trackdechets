import {
  BsffOperationCode,
  BsffStatus,
  BsffType
} from "@trackdechets/codegen/src/front.gen";

export const bsffVerboseStatuses: Record<BsffStatus, string> = {
  INITIAL: "En attente d'enlèvement",
  SIGNED_BY_EMITTER: "Signé par l'émetteur",
  SENT: "Signé par le transporteur",
  RECEIVED: "Reçu par le destinataire",
  INTERMEDIATELY_PROCESSED: "Traité, en attente de suivi",
  PROCESSED: "Traité",
  REFUSED: "Refusé par le destinataire"
};

export const OPERATION: Record<
  BsffOperationCode,
  { code: BsffOperationCode; description: string; successors: BsffType[] }
> = {
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
