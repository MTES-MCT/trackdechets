import { Prisma } from "@td/prisma";
import { prisma } from "@td/prisma";
import { getBsdasriFromActivityEvents } from "back";

export async function run() {
  // BSDasris - around 3K
  console.info("Starting to process BSDasris...");
  const bsdasrisRevisionsToFill = await prisma.bsdasriRevisionRequest.findMany({
    where: { initialWasteCode: null },
    select: { id: true, bsdasriId: true, createdAt: true }
  });

  for (const revision of bsdasrisRevisionsToFill) {
    const currentBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: revision.bsdasriId }
    });

    const bsdasriFromEvents = await getBsdasriFromActivityEvents({
      bsdasriId: revision.bsdasriId,
      at: revision.createdAt
    });
    const bsdasriSnapshot = {
      ...currentBsdasri,
      ...bsdasriFromEvents
    };

    await prisma.bsdasriRevisionRequest.update({
      where: { id: revision.id },
      data: {
        initialWasteCode: bsdasriSnapshot.wasteCode,
        initialDestinationWastePackagings:
          bsdasriSnapshot.destinationWastePackagings as Prisma.InputJsonValue,
        initialDestinationReceptionWasteWeightValue:
          bsdasriSnapshot.destinationReceptionWasteWeightValue,
        initialDestinationOperationCode:
          bsdasriSnapshot.destinationOperationCode,
        initialDestinationOperationMode:
          bsdasriSnapshot.destinationOperationMode,
        initialEmitterPickupSiteName: bsdasriSnapshot.emitterPickupSiteName,
        initialEmitterPickupSiteAddress:
          bsdasriSnapshot.emitterPickupSiteAddress,
        initialEmitterPickupSiteCity: bsdasriSnapshot.emitterPickupSiteCity,
        initialEmitterPickupSitePostalCode:
          bsdasriSnapshot.emitterPickupSitePostalCode,
        initialEmitterPickupSiteInfos: bsdasriSnapshot.emitterPickupSiteInfos
      }
    });
  }
}
