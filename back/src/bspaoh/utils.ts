import { BspaohType } from "@prisma/client";

export function getWasteDescription(wasteType: string | null) {
  if (wasteType === BspaohType.FOETUS) {
    return "Foetus";
  } else {
    return "Pièces anatomiques d'origine humaine";
  }
}
