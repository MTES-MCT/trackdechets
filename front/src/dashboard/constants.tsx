import { EmitterType, TransportMode } from "generated/graphql/types";

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
  CANCELED: "Annulé",
};

export const ITEMS_PER_PAGE = 50;

/**
 * Subset of TransportMode
 * We don't want Other to be displayed in the front
 */
enum PublicTransportMode {
  Air = "AIR",
  Rail = "RAIL",
  River = "RIVER",
  Road = "ROAD",
  Sea = "SEA",
}
export const transportModeLabels: Record<PublicTransportMode, string> = {
  [TransportMode.Road]: "Route",
  [TransportMode.Air]: "Voie aérienne",
  [TransportMode.Rail]: "Voie ferrée",
  [TransportMode.River]: "Voie fluviale",
  [TransportMode.Sea]: "Voie maritime",
};

export function getTransportModeLabel(mode: string | null | undefined) {
  if (!mode) {
    return "";
  }
  return transportModeLabels[mode];
}

export type BsdTypename = "Form" | "Bsdasri" | "Bsvhu" | "Bsda" | "Bsff";

export const emitterTypeLabels = {
  [EmitterType.Producer]: "Producteur du déchet",
  [EmitterType.Other]: "Autre détenteur",
  [EmitterType.Appendix2]:
    "Personne ayant transformé ou réalisé un traitement dont la provenance reste identifiable",
  [EmitterType.Appendix1]:
    "Collecteur d'un bordereau de tournée dédiée (Annexe 1)",
};
