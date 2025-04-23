import { prisma } from "@td/prisma";
import { RefinementCtx } from "zod";

import { ParsedZodManagedItem } from "./schema";
import { transformAndRefineItemReason } from "../../shared/transform";

export async function transformAndRefineReason(
  transportedItem: ParsedZodManagedItem,
  ctx: RefinementCtx
) {
  const transportedItemInDb = await prisma.registryManaged.findFirst({
    where: {
      publicId: transportedItem.publicId,
      reportForCompanySiret: transportedItem.reportForCompanySiret,
      isLatest: true
    }
  });

  return transformAndRefineItemReason<ParsedZodManagedItem>(
    transportedItem,
    transportedItemInDb,
    ctx
  );
}
