import { RefinementCtx } from "zod";
import { ParsedZodOutgoingTexsItem } from "./schema";
import { prisma } from "@td/prisma";
import { transformAndRefineItemReason } from "../../shared/transform";

export async function transformAndRefineReason(
  outgoingTexsItem: ParsedZodOutgoingTexsItem,
  ctx: RefinementCtx
) {
  const outgoingTexsItemInDb = await prisma.registryOutgoingTexs.findFirst({
    where: {
      publicId: outgoingTexsItem.publicId,
      reportForCompanySiret: outgoingTexsItem.reportForCompanySiret,
      isLatest: true
    }
  });

  return transformAndRefineItemReason<ParsedZodOutgoingTexsItem>(
    outgoingTexsItem,
    outgoingTexsItemInDb?.id,
    ctx
  );
}
