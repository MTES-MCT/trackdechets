import { prisma } from "@td/prisma";
import { RefinementCtx, z } from "zod";

import { ParsedZodSsdItem } from "./schema";

export async function transformAndRefineReason(
  ssdItem: ParsedZodSsdItem,
  { addIssue }: RefinementCtx
) {
  const ssdItemInDb = await prisma.registrySsd.findFirst({
    where: {
      publicId: ssdItem.publicId,
      reportForCompanySiret: ssdItem.reportForCompanySiret,
      isActive: true
    }
  });

  ssdItem.id = ssdItemInDb?.id;

  // If the line alreary exists in DB and we dont have a reason, we can simply ignore it
  if (ssdItemInDb && !ssdItem.reason) {
    ssdItem.reason = "IGNORER";
    return ssdItem;
  }

  if (!ssdItemInDb && ssdItem.reason) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `La raison doit rester vide, l'identifiant unique "${ssdItem.publicId}" n'a jamais été importé.`,
      path: ["reason"]
    });
    return z.NEVER;
  }

  return ssdItem;
}

export async function transformDestination(ssdItem: ParsedZodSsdItem) {
  if (
    !ssdItem.dispatchDate &&
    ssdItem.useDate &&
    !ssdItem.destinationCompanyType
  ) {
    ssdItem.destinationCompanyType = "ETABLISSEMENT_FR";
    ssdItem.destinationCompanyOrgId = ssdItem.reportForCompanySiret;
    ssdItem.destinationCompanyName = ssdItem.reportForCompanyName;
    ssdItem.destinationCompanyAddress = ssdItem.reportForCompanyAddress;
    ssdItem.destinationCompanyCity = ssdItem.reportForCompanyCity;
    ssdItem.destinationCompanyPostalCode = ssdItem.reportForCompanyPostalCode;
  }

  return ssdItem;
}
