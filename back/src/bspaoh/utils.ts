import { BspaohType } from "@td/prisma";

export function getWasteDescription(wasteType: string | null) {
  if (wasteType === BspaohType.FOETUS) {
    return "Foetus";
  } else {
    return "Pièces anatomiques d'origine humaine";
  }
}
