export enum BadgeStatusCode {
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

export const getBadgeStatusLabel = (status: string) => {
  switch (status) {
    case BadgeStatusCode.DRAFT:
      return "Brouillon"; // Bsdd
    case BadgeStatusCode.SEALED:
      return "En attente de signature par l’émetteur"; // Bsdd
    case BadgeStatusCode.SENT:
      return "EN ATTENTE DE RÉCEPTION"; // Bsvhu| Bsdd | Bsdasri | Bsff | Bsda
    case BadgeStatusCode.RECEIVED:
      return "reçu, en attente d’acceptation ou de refus"; // Bsdd | Bsdasri | Bsff
    case BadgeStatusCode.ACCEPTED:
      return "ACCEPTÉ, EN ATTENTE DE TRAITEMENT"; // bsdd | Bsff
    case BadgeStatusCode.PROCESSED:
      return "Traité"; // Bsvhu| Bsdd | Bsdasri | Bsff | Bsda
    case BadgeStatusCode.AWAITING_GROUP:
      return "EN ATTENTE DE REGROUPEMENT"; // Bsdd | Bsdasri;
    case BadgeStatusCode.GROUPED:
      return "ANNEXÉ À UN BORDEREAU DE REGROUPEMENT"; // Bsdd
    case BadgeStatusCode.NO_TRACEABILITY:
      return "regroupé, avec autorisation de RUPTURE DE TRAÇABILITÉ"; // Bsdd
    case BadgeStatusCode.REFUSED:
      return "REFUSÉ"; // Bsvhu| Bsdd | Bsdasri| Bsff | Bsda;
    case BadgeStatusCode.TEMP_STORED:
      return "ARRIVÉ À L’ENTREPOSAGE PROVISOIRE, EN ATTENTE D’ACCEPTATION"; // Bsdd
    case BadgeStatusCode.TEMP_STORER_ACCEPTED:
      return "entreposé temporairement ou en reconditionnement"; // Bsdd;
    case BadgeStatusCode.RESEALED:
      return "en attente de signature par l’installation d’entreposage provisoire"; // Bsdd
    case BadgeStatusCode.RESENT:
      return "EN ATTENTE DE RÉCEPTION pour traitement"; // Bsdd;
    case BadgeStatusCode.SIGNED_BY_PRODUCER:
      return "signé par l’émetteur"; // Bsvhu| Bsdd | Bsdasri | Bsda
    case BadgeStatusCode.INITIAL:
      return "initial"; // Bsvhu| Bsdasri | Bsff | Bsda
    case BadgeStatusCode.SIGNED_BY_EMITTER:
      return "signé par l’émetteur"; // Bsff
    case BadgeStatusCode.INTERMEDIATELY_PROCESSED:
      return "ANNEXÉ À UN BORDEREAU DE REGROUPEMENT"; // Bsff
    case BadgeStatusCode.SIGNED_BY_TEMP_STORER:
      return "Signé par l'installation d'entreposage provisoire"; // bsdd
    case BadgeStatusCode.PARTIALLY_REFUSED:
      return "Partiellement refusé"; // Bsff
    case BadgeStatusCode.FOLLOWED_WITH_PNTTD:
      return "Suivi via PNTTD"; // bsdd
    case BadgeStatusCode.SIGNED_BY_WORKER:
      return "Signé par l'entreprise de travaux"; // Bsda
    case BadgeStatusCode.AWAITING_CHILD:
      return "En attente ou associé à un BSD suite"; // Bsda

    default:
      return "Error unknown status";
  }
};

export interface BadgeProps {
  status: BadgeStatusCode;
  isSmall?: boolean;
}
