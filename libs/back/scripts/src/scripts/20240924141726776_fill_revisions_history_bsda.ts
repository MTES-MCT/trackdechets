import { Prisma } from "@td/prisma";
import { prisma } from "@td/prisma";
import { getBsdaFromActivityEvents } from "back";

export async function run() {
  // BSDAs - around 20K
  console.info("Starting to process BSDAs...");
  const bsdaRevisionsToFill = await prisma.bsdaRevisionRequest.findMany({
    where: { initialWasteCode: null },
    select: { id: true, bsdaId: true, createdAt: true }
  });

  for (const revision of bsdaRevisionsToFill) {
    const currentBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: revision.bsdaId },
      include: { transporters: true }
    });

    const bsdaFromEvents = await getBsdaFromActivityEvents({
      bsdaId: revision.bsdaId,
      at: revision.createdAt
    });
    const bsdaSnapshot = {
      ...currentBsda,
      ...bsdaFromEvents
    };

    await prisma.bsdaRevisionRequest.update({
      where: { id: revision.id },
      data: {
        initialWasteCode: bsdaSnapshot.wasteCode,
        initialWastePop: bsdaSnapshot.wastePop,
        initialPackagings: bsdaSnapshot.packagings as Prisma.InputJsonValue,
        initialWasteSealNumbers: bsdaSnapshot.wasteSealNumbers,
        initialWasteMaterialName: bsdaSnapshot.wasteMaterialName,
        initialDestinationCap: bsdaSnapshot.destinationCap,
        initialDestinationReceptionWeight:
          bsdaSnapshot.destinationReceptionWeight,
        initialDestinationOperationCode: bsdaSnapshot.destinationOperationCode,
        initialDestinationOperationDescription:
          bsdaSnapshot.destinationOperationDescription,
        initialDestinationOperationMode: bsdaSnapshot.destinationOperationMode,
        initialBrokerCompanyName: bsdaSnapshot.brokerCompanyName,
        initialBrokerCompanySiret: bsdaSnapshot.brokerCompanySiret,
        initialBrokerCompanyAddress: bsdaSnapshot.brokerCompanyAddress,
        initialBrokerCompanyContact: bsdaSnapshot.brokerCompanyContact,
        initialBrokerCompanyPhone: bsdaSnapshot.brokerCompanyPhone,
        initialBrokerCompanyMail: bsdaSnapshot.brokerCompanyMail,
        initialBrokerRecepisseNumber: bsdaSnapshot.brokerRecepisseNumber,
        initialBrokerRecepisseDepartment:
          bsdaSnapshot.brokerRecepisseDepartment,
        initialBrokerRecepisseValidityLimit:
          bsdaSnapshot.brokerRecepisseValidityLimit,
        initialEmitterPickupSiteName: bsdaSnapshot.emitterPickupSiteName,
        initialEmitterPickupSiteAddress: bsdaSnapshot.emitterPickupSiteAddress,
        initialEmitterPickupSiteCity: bsdaSnapshot.emitterPickupSiteCity,
        initialEmitterPickupSitePostalCode:
          bsdaSnapshot.emitterPickupSitePostalCode,
        initialEmitterPickupSiteInfos: bsdaSnapshot.emitterPickupSiteInfos
      }
    });
  }
}
