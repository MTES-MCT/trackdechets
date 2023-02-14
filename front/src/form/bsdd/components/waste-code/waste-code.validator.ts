import { BSDD_WASTES, ALL_WASTES } from "generated/constants";

export function wasteCodeValidator(wasteCode: string) {
  const wasteCodeWithoutSpaces = wasteCode.replace(/\s+/g, "");
  if (wasteCodeWithoutSpaces.length < 6) {
    return "Le code déchet saisi n'existe pas. Il doit être composé d'au moins 6 caractères.";
  }
  if (wasteCodeWithoutSpaces.length > 7) {
    return "Le code déchet saisi n'existe pas. Il doit être composé de moins de 7 caractères.";
  }

  if (BSDD_WASTES.find(waste => waste.code === wasteCode)) {
    return undefined;
  }

  if (ALL_WASTES.find(waste => waste.code === wasteCode)) {
    return "Le code déchet saisi correspond à une typologie de déchets nécessitant d'utiliser un Bordereau de suivi spécifique. Veuillez créer le bordereau adéquat (BSDA, BSFF, BSDASRI ou BSVHU).";
  }

  return "Le code déchet saisi n'existe pas.";
}
