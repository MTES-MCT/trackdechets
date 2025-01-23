import { RefinementCtx, z } from "zod";
import { ParsedZodOutgoingTexsItem } from "./schema";
import { prisma } from "@td/prisma";

export async function transformAndRefineReason(
  outgoingTexsItem: ParsedZodOutgoingTexsItem,
  { addIssue }: RefinementCtx
) {
  const outgoingTexsItemInDb = await prisma.registryOutgoingTexs.findFirst({
    where: {
      publicId: outgoingTexsItem.publicId,
      reportForCompanySiret: outgoingTexsItem.reportForCompanySiret,
      isLatest: true
    }
  });

  outgoingTexsItem.id = outgoingTexsItemInDb?.id;

  // If the line alreary exists in DB and we dont have a reason, we can simply ignore it
  if (outgoingTexsItemInDb && !outgoingTexsItem.reason) {
    outgoingTexsItem.reason = "IGNORER";
    return outgoingTexsItem;
  }

  if (!outgoingTexsItemInDb && outgoingTexsItem.reason) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `La raison doit rester vide, l'identifiant unique "${outgoingTexsItem.publicId}" n'a jamais été importé.`,
      path: ["reason"]
    });
    return z.NEVER;
  }

  return outgoingTexsItem;
}
