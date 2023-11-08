import { ALL_WASTES } from "shared/constants";

export function wasteCodeValidator(wasteCode: string) {
  const wasteCodeWithoutSpaces = wasteCode.replace(/\s+/g, "");
  if (wasteCodeWithoutSpaces.length < 6) {
    return "Le code déchet saisi n'existe pas. Il doit être composé d'au moins 6 caractères.";
  }
  if (wasteCodeWithoutSpaces.length > 7) {
    return "Le code déchet saisi n'existe pas. Il doit être composé de moins de 7 caractères.";
  }

  if (!ALL_WASTES.find(waste => waste.code === wasteCode)) {
    return "Le code déchet saisi n'existe pas.";
  }

  return undefined;
}
