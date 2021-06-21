export const statusLabels: { [key: string]: string } = {
  DRAFT: "Brouillon",
  SEALED: "En attente de collecte par le transporteur",
  SENT: "En attente de réception",
  RECEIVED: "Reçu, en attente d'acceptation ou de refus",
  ACCEPTED: "Accepté, en attente de traitement",
  PROCESSED: "Traité",
  AWAITING_GROUP: "Traité, en attente de regroupement",
  GROUPED: "Annexé à un bordereau de regroupement",
  NO_TRACEABILITY: "Regroupé, avec autorisation de rupture de traçabilité",
  REFUSED: "Refusé",
  TEMP_STORED: "Arrivé à l'entreposage provisoire, en attente d'acceptation",
  TEMP_STORER_ACCEPTED: "Entreposé temporairement ou en reconditionnement",
  RESENT: "En attente de réception pour traitement",
  RESEALED:
    "En attente de collecte par le transporteur après entreposage provisoire",
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par le producteur",
};

export const ITEMS_PER_PAGE = 50;

export const transportModeLabels: { [key: string]: string } = {
  ROAD: "Route",
  AIR: "Voie aérienne",
  RAIL: "Voie ferrée",
  RIVER: "Voie fluviale",
};

export type BsdTypename = "Form" | "Bsdasri" | "Bsvhu";
