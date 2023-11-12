import { EmitterType, TransportMode } from "codegen-ui";

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
  Sea = "SEA"
}
export const transportModeLabels: Record<PublicTransportMode, string> = {
  [TransportMode.Road]: "Route",
  [TransportMode.Air]: "Voie aérienne",
  [TransportMode.Rail]: "Voie ferrée",
  [TransportMode.River]: "Voie fluviale",
  [TransportMode.Sea]: "Voie maritime"
};

export function getTransportModeLabel(mode: string | null | undefined) {
  if (!mode) {
    return "";
  }
  return transportModeLabels[mode];
}

export type BsdTypename =
  | "Form"
  | "Bsdasri"
  | "Bsvhu"
  | "Bsda"
  | "Bsff"
  | "Bspaoh";

export const emitterTypeLabels = {
  [EmitterType.Producer]: "Producteur du déchet",
  [EmitterType.Other]: "Autre détenteur",
  [EmitterType.Appendix2]:
    "Personne ayant transformé ou réalisé un traitement dont la provenance reste identifiable",
  [EmitterType.Appendix1]:
    "Collecteur d'un bordereau de tournée dédiée (Annexe 1)"
};
