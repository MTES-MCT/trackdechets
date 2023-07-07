import { wasteCodeValidator } from "form/common/wasteCode";
import { BSDD_WASTES } from "generated/constants";

export function bsddWasteCodeValidator(wasteCode: string) {
  const error = wasteCodeValidator(wasteCode);

  if (error) {
    return error;
  }

  if (!BSDD_WASTES.find(waste => waste.code === wasteCode)) {
    return (
      "Le code déchet saisi correspond à une typologie de déchets nécessitant" +
      " d'utiliser un Bordereau de suivi spécifique. Veuillez créer le bordereau" +
      " adéquat (BSDA, BSFF, BSDASRI ou BSVHU)."
    );
  }

  return undefined;
}
