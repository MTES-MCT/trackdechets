import { Prisma } from "@prisma/client";
import {
  getBsdaFromActivityEvents,
  getBsddFromActivityEvents,
  getBsdasriFromActivityEvents
} from "back";

export async function run(tx: Prisma.TransactionClient) {
  // BSDAs - around 20K
  console.info("Starting to process BSDAs...");
  const bsdaRevisionsToFill = await tx.bsdaRevisionRequest.findMany({
    where: { initialWasteCode: null },
    select: { id: true, bsdaId: true, createdAt: true }
  });

  for (const revision of bsdaRevisionsToFill) {
    const currentBsda = await tx.bsda.findUniqueOrThrow({
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

    await tx.bsdaRevisionRequest.update({
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

  // BSDDs - around 45K
  console.info("Starting to process BSDDs...");
  const bsddRevisionsToFill = await tx.bsddRevisionRequest.findMany({
    where: { initialWasteDetailsCode: null },
    select: { id: true, bsddId: true, createdAt: true }
  });

  for (const revision of bsddRevisionsToFill) {
    const currentBsdd = await tx.form.findUniqueOrThrow({
      where: { id: revision.bsddId },
      include: {
        forwardedIn: { include: { transporters: true } },
        transporters: true
      }
    });

    const bsddFromEvents = await getBsddFromActivityEvents({
      bsddId: revision.bsddId,
      at: revision.createdAt
    });

    const bsddSnapshot = {
      ...currentBsdd,
      ...bsddFromEvents,
      forwardedIn: currentBsdd.forwardedIn,
      transporters: currentBsdd.transporters
    };

    await tx.bsddRevisionRequest.update({
      where: { id: revision.id },
      data: {
        initialRecipientCap: bsddSnapshot.recipientCap,
        initialWasteDetailsCode: bsddSnapshot.wasteDetailsCode,
        initialWasteDetailsName: bsddSnapshot.wasteDetailsName,
        initialWasteDetailsPop: bsddSnapshot.wasteDetailsPop,
        initialWasteDetailsPackagingInfos:
          bsddSnapshot.wasteDetailsPackagingInfos as Prisma.InputJsonValue,
        initialWasteAcceptationStatus: bsddSnapshot.wasteAcceptationStatus,
        initialWasteRefusalReason: bsddSnapshot.wasteRefusalReason,
        initialWasteDetailsSampleNumber: bsddSnapshot.wasteDetailsSampleNumber,
        initialWasteDetailsQuantity: bsddSnapshot.wasteDetailsQuantity,
        initialQuantityReceived: bsddSnapshot.quantityReceived,
        initialQuantityRefused: bsddSnapshot.quantityRefused,
        initialProcessingOperationDone: bsddSnapshot.processingOperationDone,
        initialDestinationOperationMode: bsddSnapshot.destinationOperationMode,
        initialProcessingOperationDescription:
          bsddSnapshot.processingOperationDescription,
        initialBrokerCompanyName: bsddSnapshot.brokerCompanyName,
        initialBrokerCompanySiret: bsddSnapshot.brokerCompanySiret,
        initialBrokerCompanyAddress: bsddSnapshot.brokerCompanyAddress,
        initialBrokerCompanyContact: bsddSnapshot.brokerCompanyContact,
        initialBrokerCompanyPhone: bsddSnapshot.brokerCompanyPhone,
        initialBrokerCompanyMail: bsddSnapshot.brokerCompanyMail,
        initialBrokerReceipt: bsddSnapshot.brokerReceipt,
        initialBrokerDepartment: bsddSnapshot.brokerDepartment,
        initialBrokerValidityLimit: bsddSnapshot.brokerValidityLimit,
        initialTraderCompanyName: bsddSnapshot.traderCompanyName,
        initialTraderCompanySiret: bsddSnapshot.traderCompanySiret,
        initialTraderCompanyAddress: bsddSnapshot.traderCompanyAddress,
        initialTraderCompanyContact: bsddSnapshot.traderCompanyContact,
        initialTraderCompanyPhone: bsddSnapshot.traderCompanyPhone,
        initialTraderCompanyMail: bsddSnapshot.traderCompanyMail,
        initialTraderReceipt: bsddSnapshot.traderReceipt,
        initialTraderDepartment: bsddSnapshot.traderDepartment,
        initialTraderValidityLimit: bsddSnapshot.traderValidityLimit,
        initialTemporaryStorageDestinationCap:
          bsddSnapshot.forwardedIn?.recipientCap,
        initialTemporaryStorageDestinationProcessingOperation:
          bsddSnapshot.forwardedIn?.processingOperationDone,
        initialTemporaryStorageTemporaryStorerQuantityReceived:
          bsddSnapshot.forwardedIn?.quantityReceived
      }
    });
  }

  // BSDasris - around 3K
  console.info("Starting to process BSDasris...");
  const bsdasrisRevisionsToFill = await tx.bsdasriRevisionRequest.findMany({
    where: { initialWasteCode: null },
    select: { id: true, bsdasriId: true, createdAt: true }
  });

  for (const revision of bsdasrisRevisionsToFill) {
    const currentBsdasri = await tx.form.findUniqueOrThrow({
      where: { id: revision.bsdasriId },
      include: {
        forwardedIn: { include: { transporters: true } },
        transporters: true
      }
    });

    const bsdasriFromEvents = await getBsdasriFromActivityEvents({
      bsdasriId: revision.bsdasriId,
      at: revision.createdAt
    });
    const bsdasriSnapshot = {
      ...currentBsdasri,
      ...bsdasriFromEvents
    };

    await tx.bsdasriRevisionRequest.update({
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
