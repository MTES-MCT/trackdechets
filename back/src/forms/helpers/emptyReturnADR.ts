import { EmptyReturnADR } from "@prisma/client";

const LABELS = {
  EMPTY_NOT_WASHED: "Vide, non nettoyé",
  EMPTY_RETURN_NOT_WASHED: "Retour à vide, non nettoyé",
  EMPTY_VEHICLE: "Véhicule vide, dernière marchandise chargée",
  EMPTY_CITERNE: "Véhicule-Citerne vide, dernière marchandise chargée"
};

export const getEmptyReturnADRLabel = (
  reason: EmptyReturnADR | null | undefined
) => {
  if (!reason) {
    return null;
  }

  return LABELS[reason];
};
