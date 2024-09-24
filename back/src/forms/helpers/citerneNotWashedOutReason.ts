import { CiterneNotWashedOutReason } from "@prisma/client";

const LABELS = {
  EXEMPTED: "Exemptions de rinçage (citerne dédiée)",
  INCOMPATIBLE: "Incompatibilité avec l'opération de rinçage à l'eau",
  UNAVAILABLE: "Indisponibilité de l'installation de rinçage",
  NOT_BY_DRIVER: "Rinçage non réalisé par le chauffeur"
};

export const getCiterneNotWashedOutReasonLabel = (
  reason: CiterneNotWashedOutReason | null | undefined
) => {
  if (!reason) {
    return null;
  }

  return LABELS[reason];
};
