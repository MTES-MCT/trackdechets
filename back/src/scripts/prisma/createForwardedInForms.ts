import { Status, Form } from "@prisma/client";
import prisma from "../../prisma";

function getForwardedInStatus(form: Form) {
  if (form.status === Status.PROCESSED) {
    return Status.PROCESSED;
  } else if (form.status === Status.REFUSED) {
    return Status.REFUSED;
  } else if (form.status === Status.RESENT) {
    return Status.SENT;
  } else if (form.status === Status.RESEALED) {
    return Status.RESEALED;
  } else if (form.status === Status.SIGNED_BY_TEMP_STORER) {
    return Status.SIGNED_BY_PRODUCER;
  } else {
    return Status.DRAFT;
  }
}

/**
 * Migrate from TemporaryStorageDetail to forwardedIn Form
 */
export default async function createForwardedInForms() {
  // list forms with temporary storage detail
  const forms = await prisma.form.findMany({
    where: { temporaryStorageDetailId: { not: null } },
    include: { temporaryStorageDetail: true }
  });
  console.log(`There are ${forms.length} forms to migrate`);
  for (const form of forms) {
    const { temporaryStorageDetail } = form;
    await prisma.form.update({
      where: { id: form.id },
      data: {
        quantityReceived: temporaryStorageDetail.tempStorerQuantityReceived,
        quantityReceivedType: temporaryStorageDetail.tempStorerQuantityType,
        wasteAcceptationStatus:
          temporaryStorageDetail.tempStorerWasteAcceptationStatus,
        wasteRefusalReason: temporaryStorageDetail.tempStorerWasteRefusalReason,
        receivedAt: temporaryStorageDetail.tempStorerReceivedAt,
        receivedBy: temporaryStorageDetail.tempStorerReceivedBy,
        signedAt: temporaryStorageDetail.tempStorerSignedAt,
        signedBy: temporaryStorageDetail.tempStorerSignedBy,
        forwardedIn: {
          create: {
            readableId: `${form.id}-suite`,
            status: getForwardedInStatus(form),
            emitterType: "PRODUCER",
            emitterCompanySiret: form.recipientCompanySiret,
            emitterCompanyName: form.recipientCompanyName,
            emitterCompanyAddress: form.recipientCompanyAddress,
            emitterCompanyContact: form.recipientCompanyContact,
            emitterCompanyPhone: form.recipientCompanyPhone,
            emitterCompanyMail: form.recipientCompanyMail,
            recipientCap: temporaryStorageDetail.destinationCap,
            recipientProcessingOperation:
              temporaryStorageDetail.destinationProcessingOperation,
            recipientCompanyName: temporaryStorageDetail.destinationCompanyName,
            recipientCompanySiret:
              temporaryStorageDetail.destinationCompanySiret,
            recipientCompanyAddress:
              temporaryStorageDetail.destinationCompanyAddress,
            recipientCompanyContact:
              temporaryStorageDetail.destinationCompanyContact,
            recipientCompanyPhone:
              temporaryStorageDetail.destinationCompanyPhone,
            recipientCompanyMail: temporaryStorageDetail.destinationCompanyMail,
            transporterCompanyName:
              temporaryStorageDetail.transporterCompanyName,
            transporterCompanySiret:
              temporaryStorageDetail.transporterCompanySiret,
            transporterCompanyAddress:
              temporaryStorageDetail.transporterCompanyAddress,
            transporterCompanyContact:
              temporaryStorageDetail.transporterCompanyContact,
            transporterCompanyPhone:
              temporaryStorageDetail.transporterCompanyPhone,
            transporterCompanyMail:
              temporaryStorageDetail.transporterCompanyMail,
            transporterCompanyVatNumber:
              temporaryStorageDetail.transporterCompanyVatNumber,
            transporterReceipt: temporaryStorageDetail.transporterReceipt,
            transporterDepartment: temporaryStorageDetail.transporterDepartment,
            transporterValidityLimit:
              temporaryStorageDetail.transporterValidityLimit,
            transporterNumberPlate:
              temporaryStorageDetail.transporterNumberPlate,
            transporterTransportMode:
              temporaryStorageDetail.transporterTransportMode,
            wasteDetailsCode: form.wasteDetailsCode,
            wasteDetailsOnuCode: temporaryStorageDetail.wasteDetailsOnuCode,
            wasteDetailsPackagingInfos:
              (temporaryStorageDetail.wasteDetailsPackagingInfos as [])
                ?.length > 0
                ? temporaryStorageDetail.wasteDetailsPackagingInfos
                : form.wasteDetailsPackagingInfos,
            wasteDetailsQuantity:
              temporaryStorageDetail.wasteDetailsQuantity ??
              form.wasteDetailsQuantity,
            wasteDetailsQuantityType:
              temporaryStorageDetail.wasteDetailsQuantityType ??
              form.wasteDetailsQuantityType,
            wasteDetailsPop: form.wasteDetailsPop,
            wasteDetailsIsDangerous: form.wasteDetailsIsDangerous,
            wasteDetailsParcelNumbers: [],
            wasteDetailsAnalysisReferences: [],
            wasteDetailsLandIdentifiers: [],
            emittedBy: temporaryStorageDetail.emittedBy,
            emittedAt: temporaryStorageDetail.emittedAt,
            emittedByEcoOrganisme: false,
            takenOverBy: temporaryStorageDetail.takenOverBy,
            takenOverAt: temporaryStorageDetail.takenOverAt,
            sentAt: temporaryStorageDetail.takenOverAt,
            sentBy: temporaryStorageDetail.emittedBy,
            isAccepted: form.isAccepted,
            receivedAt: form.receivedAt,
            quantityReceived: form.quantityReceived,
            processingOperationDone: form.processingOperationDone,
            wasteDetailsName: form.wasteDetailsName,
            isDeleted: form.isDeleted,
            receivedBy: form.receivedBy,
            wasteDetailsConsistence: form.wasteDetailsConsistence,
            processedBy: form.processedBy,
            processedAt: form.processedAt,
            nextDestinationProcessingOperation:
              form.nextDestinationProcessingOperation,
            traderCompanyName: null,
            traderCompanySiret: null,
            traderCompanyAddress: null,
            traderCompanyContact: null,
            traderCompanyPhone: null,
            traderCompanyMail: null,
            traderReceipt: null,
            traderDepartment: null,
            traderValidityLimit: null,
            brokerCompanyName: null,
            brokerCompanySiret: null,
            brokerCompanyAddress: null,
            brokerCompanyContact: null,
            brokerCompanyPhone: null,
            brokerCompanyMail: null,
            brokerReceipt: null,
            brokerDepartment: null,
            brokerValidityLimit: null,
            processingOperationDescription: form.processingOperationDescription,
            noTraceability: form.noTraceability,
            signedByTransporter: temporaryStorageDetail.signedByTransporter,
            transporterIsExemptedOfReceipt:
              temporaryStorageDetail.transporterIsExemptedOfReceipt,
            customId: null,
            wasteAcceptationStatus: form.wasteAcceptationStatus,
            wasteRefusalReason: form.wasteRefusalReason,
            nextDestinationCompanyName: form.nextDestinationCompanyName,
            nextDestinationCompanySiret: form.nextDestinationCompanySiret,
            nextDestinationCompanyAddress: form.nextDestinationCompanyAddress,
            nextDestinationCompanyContact: form.nextDestinationCompanyContact,
            nextDestinationCompanyPhone: form.nextDestinationCompanyPhone,
            nextDestinationCompanyMail: form.nextDestinationCompanyMail,
            emitterWorkSiteName: null,
            emitterWorkSiteAddress: null,
            emitterWorkSiteCity: null,
            emitterWorkSitePostalCode: null,
            emitterWorkSiteInfos: null,
            transporterCustomInfo: temporaryStorageDetail.transporterCustomInfo,
            recipientIsTempStorage: false,
            signedAt: form.signedAt,
            currentTransporterSiret:
              temporaryStorageDetail.transporterCompanySiret,
            nextDestinationCompanyCountry: form.nextDestinationCompanyCountry,
            signedBy: form.signedBy,
            ownerId: form.ownerId
          }
        }
      }
    });
  }
}
