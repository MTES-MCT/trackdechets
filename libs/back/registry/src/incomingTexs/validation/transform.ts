import { RefinementCtx, z } from "zod";
import { ParsedZodIncomingTexsItem } from "./schema";
import { prisma } from "@td/prisma";

export async function transformAndRefineReason(
  incomingTexsItem: ParsedZodIncomingTexsItem,
  { addIssue }: RefinementCtx
) {
  const incomingTexsItemInDb = await prisma.registryIncomingTexs.findFirst({
    where: {
      publicId: incomingTexsItem.publicId,
      reportForSiret: incomingTexsItem.reportForSiret,
      isActive: true
    }
  });

  incomingTexsItem.id = incomingTexsItemInDb?.id;

  // If the line alreary exists in DB and we dont have a reason, we can simply ignore it
  if (incomingTexsItemInDb && !incomingTexsItem.reason) {
    incomingTexsItem.reason = "IGNORER";
    return incomingTexsItem;
  }

  if (!incomingTexsItemInDb && incomingTexsItem.reason) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `La raison doit rester vide, le numéro unique "${incomingTexsItem.publicId}" n'a jamais été importé.`,
      path: ["reason"]
    });
    return z.NEVER;
  }

  return incomingTexsItem;
}
