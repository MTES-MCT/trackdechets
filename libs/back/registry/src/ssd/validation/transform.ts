import { prisma } from "@td/prisma";
import { RefinementCtx, z } from "zod";

import { ParsedZodSsdItem } from "./schema";

export async function transformAndRefineReason(
  ssdItem: ParsedZodSsdItem,
  { addIssue }: RefinementCtx
) {
  const ssdLine = await prisma.registrySsd.findFirst({
    where: { publicId: ssdItem.publicId }
  });

  if (ssdLine && !ssdItem.reason) {
    const itemHasChanged = Object.entries(ssdItem).reduce(
      (hasChanged, entry) => {
        const [key, value] = entry;
        return hasChanged || ssdLine[key] !== value; // TODO handle arrays & dates
      },
      false
    );

    if (!itemHasChanged) {
      ssdItem.reason = "IGNORER";
      return ssdItem;
    }

    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le numéro unique "${ssdItem.publicId}" existe déjà. La raison est donc requise pour préciser s'il s'égit d'une modification ou d'une annulation.`,
      path: ["reason"]
    });
    return z.NEVER;
  }

  if (!ssdLine && ssdItem.reason) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `La raison doit rester vide, le numéro unique "${ssdItem.publicId}" n'a jamais été importé.`,
      path: ["reason"]
    });
    return z.NEVER;
  }

  return ssdItem;
}
