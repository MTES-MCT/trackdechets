import { RefinementCtx, z } from "zod";
import { ParsedZodIncomingWasteItem } from "./schema";
import { prisma } from "@td/prisma";

export async function transformAndRefineReason(
  incomingWasteItem: ParsedZodIncomingWasteItem,
  { addIssue }: RefinementCtx
) {
  const incomingWasteItemInDb = await prisma.registryIncomingWaste.findFirst({
    where: {
      publicId: incomingWasteItem.publicId,
      reportForSiret: incomingWasteItem.reportForSiret,
      isActive: true
    }
  });

  // If the line alreary exists in DB and we dont have a reason, we can simply ignore it
  if (incomingWasteItemInDb && !incomingWasteItem.reason) {
    incomingWasteItem.reason = "IGNORER";
    return incomingWasteItem;
  }

  if (!incomingWasteItemInDb && incomingWasteItem.reason) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `La raison doit rester vide, le numéro unique "${incomingWasteItem.publicId}" n'a jamais été importé.`,
      path: ["reason"]
    });
    return z.NEVER;
  }

  return incomingWasteItem;
}
