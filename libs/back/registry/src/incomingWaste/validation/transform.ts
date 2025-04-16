import { RefinementCtx } from "zod";
import { ParsedZodIncomingWasteItem } from "./schema";
import { prisma } from "@td/prisma";
import { transformAndRefineItemReason } from "../../shared/transform";

export async function transformAndRefineReason(
  incomingWasteItem: ParsedZodIncomingWasteItem,
  ctx: RefinementCtx
) {
  const incomingWasteItemInDb = await prisma.registryIncomingWaste.findFirst({
    where: {
      publicId: incomingWasteItem.publicId,
      reportForCompanySiret: incomingWasteItem.reportForCompanySiret,
      isLatest: true
    }
  });

  return transformAndRefineItemReason<ParsedZodIncomingWasteItem>(
    incomingWasteItem,
    incomingWasteItemInDb,
    ctx
  );
}
