import { RefinementCtx } from "zod";
import { ParsedZodIncomingTexsItem } from "./schema";
import { prisma } from "@td/prisma";
import { transformAndRefineItemReason } from "../../shared/transform";

export async function transformAndRefineReason(
  incomingTexsItem: ParsedZodIncomingTexsItem,
  ctx: RefinementCtx
) {
  const incomingTexsItemInDb = await prisma.registryIncomingTexs.findFirst({
    where: {
      publicId: incomingTexsItem.publicId,
      reportForCompanySiret: incomingTexsItem.reportForCompanySiret,
      isLatest: true
    }
  });

  return transformAndRefineItemReason<ParsedZodIncomingTexsItem>(
    incomingTexsItem,
    incomingTexsItemInDb?.id,
    ctx
  );
}
