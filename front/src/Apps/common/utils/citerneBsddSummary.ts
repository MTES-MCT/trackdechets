import { CiterneNotWashedOutReason } from "@td/codegen-ui";

export const CITERNE_NOT_WASHED_OUT_REASON = {
  [CiterneNotWashedOutReason.Exempted]:
    "Exemptions de rinçage (citerne dédiée)",
  [CiterneNotWashedOutReason.Incompatible]:
    "Incompatibilité avec l'opération de rinçage à l'eau",
  [CiterneNotWashedOutReason.Unavailable]:
    "Incompatiblité de l'installation de rinçage",
  [CiterneNotWashedOutReason.NotByDriver]:
    "Rinçage non réalisé par le chauffeur"
};
