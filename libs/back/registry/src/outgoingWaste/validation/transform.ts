import { RefinementCtx } from "zod";
import { ParsedZodOutgoingWasteItem } from "./schema";
import { prisma } from "@td/prisma";
import { transformAndRefineItemReason } from "../../shared/transform";

export async function transformAndRefineReason(
  outgoingWasteItem: ParsedZodOutgoingWasteItem,
  ctx: RefinementCtx
) {
  const outgoingWasteItemInDb = await prisma.registryOutgoingWaste.findFirst({
    where: {
      publicId: outgoingWasteItem.publicId,
      reportForCompanySiret: outgoingWasteItem.reportForCompanySiret,
      isLatest: true
    }
  });

  return transformAndRefineItemReason<ParsedZodOutgoingWasteItem>(
    outgoingWasteItem,
    outgoingWasteItemInDb,
    ctx
  );
}
