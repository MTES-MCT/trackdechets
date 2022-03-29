import { EmitterType, TransportMode } from "generated/graphql/types";

export const statusLabels: { [key: string]: string } = {
  DRAFT: "Brouillon",
  SEALED: "En attente de signature par l'émetteur",
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
    "En attente de signature par l'installation d'entreposage provisoire",
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par l'émetteur",
  SIGNED_BY_EMITTER: "Signé par l'émetteur",
  SIGNED_BY_TEMP_STORER: "Signé par l'installation d'entreposage provisoire",
};

export const ITEMS_PER_PAGE = 50;

export const transportModeLabels: Record<TransportMode, string> = {
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
    "Collecteur de petites quantités de déchets relevant d’une même rubrique",
};
