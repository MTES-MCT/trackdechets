import {
  BsffStatus,
  BsdaStatus,
  BsdasriStatus,
  BsvhuStatus
} from "@prisma/client";

export const statusLabels: { [key: string]: string } = {
  DRAFT: "Brouillon",
  SEALED: "En attente de signature par l'émetteur",
  SENT: "En attente de réception",
  RECEIVED: "Reçu, en attente d'acceptation ou de refus",
  ACCEPTED: "Accepté, en attente de traitement",
  PROCESSED: "Traité",
  AWAITING_GROUP: "En attente de regroupement",
  FOLLOWED_WITH_PNTTD: "Suivi via PNTTD",
  GROUPED: "Annexé à un bordereau de regroupement",
  NO_TRACEABILITY: "Regroupé, avec autorisation de rupture de traçabilité",
  REFUSED: "Refusé",
  TEMP_STORED: "Arrivé à l'entreposage provisoire, en attente d'acceptation",
  TEMP_STORER_ACCEPTED: "Entreposé temporairement ou en reconditionnement",
  RESENT: "En attente de réception pour traitement",
  RESEALED:
    "En attente de signature par l'installation d'entreposage provisoire",
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par l'émetteur",
  SIGNED_BY_EMITTER: "Signé par l'émetteur",
  SIGNED_BY_TEMP_STORER: "Signé par l'installation d'entreposage provisoire",
  SIGNED_BY_WORKER: "Signé par l'entreprise de travaux",
  AWAITING_CHILD: "En attente ou associé à un BSD suite",
  CANCELED: "Annulé"
};

export const vhuVerboseStatuses: Record<BsvhuStatus, string> = {
  ...statusLabels,
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par le producteur",
  SENT: "En cours d'acheminement",
  PROCESSED: "Traité",
  REFUSED: "Refusé"
};

export const dasriVerboseStatuses: Record<BsdasriStatus, string> = {
  ...statusLabels,
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par l'émetteur",
  SENT: "Envoyé",
  RECEIVED: "Reçu",
  PROCESSED: "Traité",
  REFUSED: "Refusé",
  AWAITING_GROUP: "En attente de regroupement"
};

export const bsdaVerboseStatuses: Record<BsdaStatus, string> = {
  ...statusLabels,
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par le producteur",
  SIGNED_BY_WORKER: "Signé par l'entreprise de travaux",
  SENT: "Envoyé",
  PROCESSED: "Traité",
  REFUSED: "Refusé",
  AWAITING_CHILD: "En attente d'un BSDA suite",
  CANCELED: "Annulé"
};

export const bsffVerboseStatuses: Record<BsffStatus, string> = {
  ...statusLabels,
  INITIAL: "En attente de signature par l'émetteur",
  SIGNED_BY_EMITTER: "Signé par l'émetteur",
  SENT: "Signé par le transporteur",
  RECEIVED: "Reçu par le destinataire",
  INTERMEDIATELY_PROCESSED: "Traité, en attente de suivi",
  PROCESSED: "Traité",
  REFUSED: "Refusé par le destinataire",
  ACCEPTED: "En attente de traitement",
  PARTIALLY_REFUSED: "Refusé partiellement, en attente de traitement"
};

export const formatStatusLabel = (_, bsd) => {
  if (bsd.bsdType === "BSDD") return statusLabels[bsd.status];
  if (bsd.bsdType === "BSVHU") return vhuVerboseStatuses[bsd.status];
  if (bsd.bsdType === "BSFF") return bsffVerboseStatuses[bsd.status];
  if (bsd.bsdType === "BSDASRI") return dasriVerboseStatuses[bsd.status];
  if (bsd.bsdType === "BSDA") return bsdaVerboseStatuses[bsd.status];
  return "";
};
