import { Prisma } from "@td/prisma";
import { prisma } from "@td/prisma";
import { getBsddFromActivityEvents } from "back";

export async function run() {
  // BSDDs - around 45K
  console.info("Starting to process BSDDs...");
  const bsddRevisionsToFill = await prisma.bsddRevisionRequest.findMany({
    where: { initialWasteDetailsCode: null },
    select: { id: true, bsddId: true, createdAt: true }
  });

  for (const revision of bsddRevisionsToFill) {
    const currentBsdd = await prisma.form.findUniqueOrThrow({
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

    await prisma.bsddRevisionRequest.update({
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
}
