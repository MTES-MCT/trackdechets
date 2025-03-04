import { prisma } from "@td/prisma";
import { RefinementCtx } from "zod";

import { ParsedZodTransportedItem } from "./schema";
import { transformAndRefineItemReason } from "../../shared/transform";
import { getCachedCompany } from "../../shared/helpers";

export async function transformAndRefineReason(
  transportedItem: ParsedZodTransportedItem,
  ctx: RefinementCtx
) {
  const transportedItemInDb = await prisma.registryTransported.findFirst({
    where: {
      publicId: transportedItem.publicId,
      reportForCompanySiret: transportedItem.reportForCompanySiret,
      isLatest: true
    }
  });

  return transformAndRefineItemReason<ParsedZodTransportedItem>(
    transportedItem,
    transportedItemInDb?.id,
    ctx
  );
}

export async function transformReportForRecepisseNumber(
  transportedItem: ParsedZodTransportedItem
) {
  const company = await getCachedCompany(transportedItem.reportForCompanySiret);

  if (
    !transportedItem.reportForRecepisseNumber &&
    company?.transporterReceiptId
  ) {
    transportedItem.reportForRecepisseNumber = company?.transporterReceiptId;
  }

  return transportedItem;
}
