import { RefinementCtx, z } from "zod";
import { ParsedZodOutgoingWasteItem } from "./schema";
import { prisma } from "@td/prisma";

export async function transformAndRefineReason(
  outgoingWasteItem: ParsedZodOutgoingWasteItem,
  { addIssue }: RefinementCtx
) {
  const outgoingWasteItemInDb = await prisma.registryOutgoingWaste.findFirst({
    where: {
      publicId: outgoingWasteItem.publicId,
      reportForCompanySiret: outgoingWasteItem.reportForCompanySiret,
      isLatest: true
    }
  });

  outgoingWasteItem.id = outgoingWasteItemInDb?.id;

  // If the line alreary exists in DB and we dont have a reason, we can simply ignore it
  if (outgoingWasteItemInDb && !outgoingWasteItem.reason) {
    outgoingWasteItem.reason = "IGNORER";
    return outgoingWasteItem;
  }

  if (!outgoingWasteItemInDb && outgoingWasteItem.reason) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `La raison doit rester vide, l'identifiant unique "${outgoingWasteItem.publicId}" n'a jamais été importé.`,
      path: ["reason"]
    });
    return z.NEVER;
  }

  return outgoingWasteItem;
}
