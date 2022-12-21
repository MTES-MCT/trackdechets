import {
  BsdaEcoOrganisme,
  BsdaWeight,
  BsffWeight,
  BsvhuWeight,
  Maybe,
  Scalars,
} from "generated/graphql/types";

export enum BsdTypename {
  Bsdd = "Form",
  Bsda = "Bsda",
  Bsdasri = "Bsdasri",
  Bsvhu = "Bsvhu",
  Bsff = "Bsff",
}

export enum BsdStatusCode {
  DRAFT = "DRAFT",
  SEALED = "SEALED",
  SENT = "SENT",
  RECEIVED = "RECEIVED",
  ACCEPTED = "ACCEPTED",
  PROCESSED = "PROCESSED",
  AWAITING_GROUP = "AWAITING_GROUP",
  GROUPED = "GROUPED",
  NO_TRACEABILITY = "NO_TRACEABILITY",
  REFUSED = "REFUSED",
  TEMP_STORED = "TEMP_STORED",
  TEMP_STORER_ACCEPTED = "TEMP_STORER_ACCEPTED",
  RESEALED = "RESEALED",
  RESENT = "RESENT",
  SIGNED_BY_PRODUCER = "SIGNED_BY_PRODUCER",
  INITIAL = "INITIAL",
  SIGNED_BY_EMITTER = "SIGNED_BY_EMITTER",
  INTERMEDIATELY_PROCESSED = "INTERMEDIATELY_PROCESSED",
  PARTIALLY_REFUSED = "PARTIALLY_REFUSED",
  FOLLOWED_WITH_PNTTD = "FOLLOWED_WITH_PNTTD",
  SIGNED_BY_TEMP_STORER = "SIGNED_BY_TEMP_STORER",
  SIGNED_BY_WORKER = "SIGNED_BY_WORKER",
  AWAITING_CHILD = "AWAITING_CHILD",
}

export const getBsdStatusLabel = (status: string) => {
  switch (status) {
    case BsdStatusCode.DRAFT:
      return "Brouillon"; // Bsdd
    case BsdStatusCode.SEALED:
      return "En attente de signature par l’émetteur"; // Bsdd
    case BsdStatusCode.SENT:
      return "EN ATTENTE DE RÉCEPTION"; // Bsvhu| Bsdd | Bsdasri | Bsff | Bsda
    case BsdStatusCode.RECEIVED:
      return "reçu, en attente d’acceptation ou de refus"; // Bsdd | Bsdasri | Bsff
    case BsdStatusCode.ACCEPTED:
      return "ACCEPTÉ, EN ATTENTE DE TRAITEMENT"; // bsdd | Bsff
    case BsdStatusCode.PROCESSED:
      return "Traité"; // Bsvhu| Bsdd | Bsdasri | Bsff | Bsda
    case BsdStatusCode.AWAITING_GROUP:
      return "EN ATTENTE DE REGROUPEMENT"; // Bsdd | Bsdasri;
    case BsdStatusCode.GROUPED:
      return "ANNEXÉ À UN BORDEREAU DE REGROUPEMENT"; // Bsdd
    case BsdStatusCode.NO_TRACEABILITY:
      return "regroupé, avec autorisation de RUPTURE DE TRAÇABILITÉ"; // Bsdd
    case BsdStatusCode.REFUSED:
      return "REFUSÉ"; // Bsvhu| Bsdd | Bsdasri| Bsff | Bsda;
    case BsdStatusCode.TEMP_STORED:
      return "ARRIVÉ À L’ENTREPOSAGE PROVISOIRE, EN ATTENTE D’ACCEPTATION"; // Bsdd
    case BsdStatusCode.TEMP_STORER_ACCEPTED:
      return "entreposé temporairement ou en reconditionnement"; // Bsdd;
    case BsdStatusCode.RESEALED:
      return "en attente de signature par l’installation d’entreposage provisoire"; // Bsdd
    case BsdStatusCode.RESENT:
      return "EN ATTENTE DE RÉCEPTION pour traitement"; // Bsdd;
    case BsdStatusCode.SIGNED_BY_PRODUCER:
      return "signé par l’émetteur"; // Bsvhu| Bsdd | Bsdasri | Bsda
    case BsdStatusCode.INITIAL:
      return "initial"; // Bsvhu| Bsdasri | Bsff | Bsda
    case BsdStatusCode.SIGNED_BY_EMITTER:
      return "signé par l’émetteur"; // Bsff
    case BsdStatusCode.INTERMEDIATELY_PROCESSED:
      return "ANNEXÉ À UN BORDEREAU DE REGROUPEMENT"; // Bsff
    case BsdStatusCode.SIGNED_BY_TEMP_STORER:
      return "Signé par l'installation d'entreposage provisoire"; // bsdd
    case BsdStatusCode.PARTIALLY_REFUSED:
      return "Partiellement refusé"; // Bsff
    case BsdStatusCode.FOLLOWED_WITH_PNTTD:
      return "Suivi via PNTTD"; // bsdd
    case BsdStatusCode.SIGNED_BY_WORKER:
      return "Signé par l'entreprise de travaux"; // Bsda
    case BsdStatusCode.AWAITING_CHILD:
      return "En attente ou associé à un BSD suite"; // Bsda

    default:
      return "Error unknown status";
  }
};

export interface BsdDisplay {
  id: string;
  status: BsdStatusCode;
  wasteDetails: {
    code?: Maybe<string>;
    name?: Maybe<string>;
    weight?:
      | Maybe<number>
      | Maybe<BsdaWeight>
      | Maybe<BsvhuWeight>
      | Maybe<BsffWeight>;
  };
  isTempStorage?: Maybe<boolean>;
  updatedAt?: Maybe<string> | Maybe<Scalars["DateTime"]>;
  emittedByEcoOrganisme?: Maybe<boolean> | Maybe<BsdaEcoOrganisme>;
}
