import { EmptyReturnADR } from "@prisma/client";

const LABELS = {
  EMPTY_NOT_WASHED: "Vide, non nettoyé", // Deprecated
  EMPTY_RETURN_NOT_WASHED: "Retour à vide, non nettoyé",
  EMPTY_VEHICLE: "Véhicule vide, dernière marchandise chargée",
  EMPTY_CITERNE: "Véhicule-Citerne vide, dernière marchandise chargée",
  EMPTY_CONTAINER: "Conteneur vide, dernière marchandise chargée",
  EMPTY_CITERNE_CONTAINER:
    "Conteneur-citerne vide, dernière marchandise chargée"
};

export const getEmptyReturnADRLabel = (
  reason: EmptyReturnADR | null | undefined
) => {
  if (!reason) {
    return null;
  }

  return LABELS[reason];
};
