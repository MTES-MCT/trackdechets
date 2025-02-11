import { prisma } from "@td/prisma";
import { RefinementCtx } from "zod";

import { ParsedZodSsdItem } from "./schema";
import { transformAndRefineItemReason } from "../../shared/transform";

export async function transformAndRefineReason(
  ssdItem: ParsedZodSsdItem,
  ctx: RefinementCtx
) {
  const ssdItemInDb = await prisma.registrySsd.findFirst({
    where: {
      publicId: ssdItem.publicId,
      reportForCompanySiret: ssdItem.reportForCompanySiret,
      isLatest: true
    }
  });

  return transformAndRefineItemReason<ParsedZodSsdItem>(
    ssdItem,
    ssdItemInDb?.id,
    ctx
  );
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
