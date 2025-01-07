import { TransportMode } from "@prisma/client";

export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  [TransportMode.ROAD]: "Route",
  [TransportMode.AIR]: "Voie aérienne",
  [TransportMode.RAIL]: "Voie ferrée",
  [TransportMode.RIVER]: "Voie fluviale",
  [TransportMode.SEA]: "Voie maritime",
  [TransportMode.OTHER]: "Autres",
  [TransportMode.UNKNOWN]: "Non renseigné"
};
