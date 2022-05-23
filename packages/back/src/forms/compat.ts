import {
  Form,
  QuantityType,
  Status,
  TemporaryStorageDetail,
  TransportSegment
} from "@prisma/client";
import { Bsdd } from "./types";

/**
 * Convert a simple form (without temporary storage) to a BSDD v2
 * @param form
 * @returns
 */
export function simpleFormToBsdd(
  form: Form & { transportSegments?: TransportSegment[] }
): Bsdd {
  const [transporter2, transporter3] = form.transportSegments ?? [];

  return {
    id: form.readableId,
    customId: form.customId,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    isDeleted: form.isDeleted,
    isDraft: form.status == Status.DRAFT,
    status: form.status,
    wasteCode: form.wasteDetailsCode,
    wasteDescription: form.wasteDetailsName,
    pop: form.wasteDetailsPop,
    traderCompanyName: form.traderCompanyName,
    traderCompanySiret: form.traderCompanySiret,
    traderCompanyAddress: form.traderCompanyAddress,
    traderCompanyContact: form.traderCompanyContact,
    traderCompanyPhone: form.traderCompanyPhone,
    traderCompanyMail: form.traderCompanyMail,
    traderRecepisseNumber: form.traderReceipt,
    traderRecepisseDepartment: form.traderDepartment,
    traderRecepisseValidityLimit: form.traderValidityLimit,
    brokerCompanyName: form.brokerCompanyName,
    brokerCompanySiret: form.brokerCompanySiret,
    brokerCompanyAddress: form.brokerCompanyAddress,
    brokerCompanyContact: form.brokerCompanyContact,
    brokerCompanyPhone: form.brokerCompanyPhone,
    brokerCompanyMail: form.brokerCompanyMail,
    brokerRecepisseNumber: form.brokerReceipt,
    brokerRecepisseDepartment: form.brokerDepartment,
    brokerRecepisseValidityLimit: form.brokerValidityLimit,
    ecoOrganismeName: form.ecoOrganismeName,
    ecoOrganismeSiret: form.ecoOrganismeSiret,
    emitterCompanyName: form.emitterCompanyName,
    emitterCompanySiret: form.emitterCompanySiret,
    emitterCompanyAddress: form.emitterCompanyAddress,
    emitterCompanyContact: form.emitterCompanyContact,
    emitterCompanyPhone: form.emitterCompanyPhone,
    emitterCompanyMail: form.emitterCompanyMail,
    emitterCustomInfo: null,
    emitterPickupSiteName: form.emitterWorkSiteName,
    emitterPickupSiteAddress: form.emitterWorkSiteAddress,
    emitterPickupSiteCity: form.emitterWorkSiteCity,
    emitterPickupSitePostalCode: form.emitterWorkSitePostalCode,
    emitterPickupSiteInfos: form.emitterWorkSiteInfos,
    emitterEmissionSignatureAuthor: form.sentBy,
    emitterEmissionSignatureDate: form.sentAt,
    packagings: form.wasteDetailsPackagingInfos,
    weightValue: form.wasteDetailsQuantity,
    wasteAdr: form.wasteDetailsOnuCode,
    weightIsEstimate: form.wasteDetailsQuantityType == QuantityType.ESTIMATED,
    transporterCompanyName: form.transporterCompanyName,
    transporterCompanySiret: form.transporterCompanySiret,
    transporterCompanyVatNumber: form.transporterCompanyVatNumber,
    transporterCompanyAddress: form.transporterCompanyAddress,
    transporterCompanyContact: form.transporterCompanyContact,
    transporterCompanyPhone: form.transporterCompanyPhone,
    transporterCompanyMail: form.transporterCompanyMail,
    transporterCustomInfo: form.transporterCustomInfo,
    transporterRecepisseIsExempted: form.transporterIsExemptedOfReceipt,
    transporterRecepisseNumber: form.transporterReceipt,
    transporterRecepisseDepartment: form.transporterDepartment,
    transporterRecepisseValidityLimit: form.transporterValidityLimit,
    transporterTransportMode: form.transporterTransportMode,
    transporterTransportTakenOverAt: form.sentAt,
    transporterTransportSignatureAuthor: null,
    transporterTransportSignatureDate: form.sentAt,
    transporterNumberPlates: form.transporterNumberPlate
      ? [form.transporterNumberPlate]
      : [],
    transporter2CompanyName: transporter2?.transporterCompanyName,
    transporter2CompanySiret: transporter2?.transporterCompanySiret,
    transporter2CompanyVatNumber: null,
    transporter2CompanyAddress: transporter2?.transporterCompanyAddress,
    transporter2CompanyContact: transporter2?.transporterCompanyContact,
    transporter2CompanyPhone: transporter2?.transporterCompanyPhone,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,
    transporter2CustomInfo: null,
    transporter2RecepisseIsExempted:
      transporter2?.transporterIsExemptedOfReceipt,
    transporter2RecepisseNumber: transporter2?.transporterReceipt,
    transporter2RecepisseDepartment: transporter2?.transporterDepartment,
    transporter2RecepisseValidityLimit: transporter2?.transporterValidityLimit,
    transporter2TransportMode: transporter2?.mode,
    transporter2TransportTakenOverAt: transporter2?.takenOverAt,
    transporter2TransportSignatureAuthor: transporter2?.takenOverBy,
    transporter2TransportSignatureDate: transporter2?.takenOverAt,
    transporter2NumberPlates: transporter2?.transporterNumberPlate
      ? [transporter2.transporterNumberPlate]
      : [],
    transporter3CompanyName: transporter3?.transporterCompanyName,
    transporter3CompanySiret: transporter3?.transporterCompanySiret,
    transporter3CompanyVatNumber: null,
    transporter3CompanyAddress: transporter3?.transporterCompanyAddress,
    transporter3CompanyContact: transporter3?.transporterCompanyContact,
    transporter3CompanyPhone: transporter3?.transporterCompanyPhone,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,
    transporter3CustomInfo: null,
    transporter3RecepisseIsExempted:
      transporter3?.transporterIsExemptedOfReceipt,
    transporter3RecepisseNumber: transporter3?.transporterReceipt,
    transporter3RecepisseDepartment: transporter3?.transporterDepartment,
    transporter3RecepisseValidityLimit: transporter3?.transporterValidityLimit,
    transporter3TransportMode: transporter3?.mode,
    transporter3TransportTakenOverAt: transporter3?.takenOverAt,
    transporter3TransportSignatureAuthor: transporter3?.takenOverBy,
    transporter3TransportSignatureDate: transporter3?.takenOverAt,
    transporter3NumberPlates: transporter3?.transporterNumberPlate
      ? [transporter3.transporterNumberPlate]
      : [],
    destinationCompanyName: form.recipientCompanyName,
    destinationCompanySiret: form.recipientCompanySiret,
    destinationCompanyAddress: form.recipientCompanyAddress,
    destinationCompanyContact: form.recipientCompanyContact,
    destinationCompanyPhone: form.recipientCompanyPhone,
    destinationCompanyMail: form.recipientCompanyMail,
    destinationCustomInfo: null,
    destinationReceptionDate: form.receivedAt,
    destinationReceptionWeight: form.quantityReceived,
    destinationReceptionAcceptationStatus: form.wasteAcceptationStatus,
    destinationReceptionRefusalReason: form.wasteRefusalReason,
    destinationReceptionSignatureAuthor: form.receivedBy,
    destinationReceptionSignatureDate: form.receivedAt,
    destinationPlannedOperationCode: form.recipientProcessingOperation,
    destinationOperationCode: form.processingOperationDone,
    destinationOperationSignatureAuthor: form.processedBy,
    destinationOperationDate: form.processedAt,
    destinationOperationSignatureDate: form.processedAt,
    destinationCap: form.recipientCap,
    destinationOperationNoTraceability: form.noTraceability,
    destinationOperationNextDestinationCompanyName:
      form.nextDestinationCompanyName,
    destinationOperationNextDestinationCompanySiret:
      form.nextDestinationCompanySiret,
    destinationOperationNextDestinationCompanyVatNumber: null,
    destinationOperationNextDestinationCompanyAddress:
      form.nextDestinationCompanyAddress,
    destinationOperationNextDestinationCompanyContact:
      form.nextDestinationCompanyContact,
    destinationOperationNextDestinationCompanyPhone:
      form.nextDestinationCompanyPhone,
    destinationOperationNextDestinationCompanyMail:
      form.nextDestinationCompanyMail
  };
}

/**
 * Convert a form with temporary storage into a BSDD v2
 */
export function formWithTempStorageToBsdd(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  } & { transportSegments: TransportSegment[] }
): Bsdd & { forwarding: Bsdd & { grouping: Bsdd[] } } {
  const temporaryStorage = form.temporaryStorageDetail;
  const initial: Bsdd = {
    ...simpleFormToBsdd(form),
    destinationReceptionDate: temporaryStorage.tempStorerReceivedAt,
    destinationReceptionWeight: temporaryStorage.tempStorerQuantityReceived,
    destinationReceptionAcceptationStatus:
      temporaryStorage.tempStorerWasteAcceptationStatus,
    destinationReceptionRefusalReason:
      temporaryStorage.tempStorerWasteRefusalReason,
    destinationReceptionSignatureAuthor: temporaryStorage.tempStorerSignedBy,
    destinationReceptionSignatureDate: temporaryStorage.tempStorerSignedAt,
    destinationPlannedOperationCode: form.recipientProcessingOperation,
    destinationOperationCode: form.recipientProcessingOperation,
    destinationOperationSignatureAuthor: form.receivedBy,
    destinationOperationSignatureDate: form.receivedAt,
    destinationOperationDate: form.receivedAt,
    destinationOperationNoTraceability: false,
    destinationOperationNextDestinationCompanyName: null,
    destinationOperationNextDestinationCompanySiret: null,
    destinationOperationNextDestinationCompanyVatNumber: null,
    destinationOperationNextDestinationCompanyAddress: null,
    destinationOperationNextDestinationCompanyContact: null,
    destinationOperationNextDestinationCompanyPhone: null,
    destinationOperationNextDestinationCompanyMail: null
  };

  const reexpedition: Bsdd = {
    id: form.readableId,
    customId: null,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    isDeleted: form.isDeleted,
    isDraft: form.status == Status.DRAFT,
    status: form.status,
    wasteCode: form.wasteDetailsCode,
    wasteDescription: form.wasteDetailsName,
    pop: form.wasteDetailsPop,
    traderCompanyName: form.traderCompanyName,
    traderCompanySiret: form.traderCompanySiret,
    traderCompanyAddress: form.traderCompanyAddress,
    traderCompanyContact: form.traderCompanyContact,
    traderCompanyPhone: form.traderCompanyPhone,
    traderCompanyMail: form.traderCompanyMail,
    traderRecepisseNumber: form.traderReceipt,
    traderRecepisseDepartment: form.traderDepartment,
    traderRecepisseValidityLimit: form.traderValidityLimit,
    brokerCompanyName: form.brokerCompanyName,
    brokerCompanySiret: form.brokerCompanySiret,
    brokerCompanyAddress: form.brokerCompanyAddress,
    brokerCompanyContact: form.brokerCompanyContact,
    brokerCompanyPhone: form.brokerCompanyPhone,
    brokerCompanyMail: form.brokerCompanyMail,
    brokerRecepisseNumber: form.brokerReceipt,
    brokerRecepisseDepartment: form.brokerDepartment,
    brokerRecepisseValidityLimit: form.brokerValidityLimit,
    ecoOrganismeName: form.ecoOrganismeName,
    ecoOrganismeSiret: form.ecoOrganismeSiret,
    emitterCompanyName: form.recipientCompanyName,
    emitterCompanySiret: form.recipientCompanySiret,
    emitterCompanyAddress: form.recipientCompanyAddress,
    emitterCompanyContact: form.recipientCompanyContact,
    emitterCompanyPhone: form.recipientCompanyPhone,
    emitterCompanyMail: form.recipientCompanyMail,
    emitterCustomInfo: null,
    emitterPickupSiteName: null,
    emitterPickupSiteAddress: null,
    emitterPickupSiteCity: null,
    emitterPickupSitePostalCode: null,
    emitterPickupSiteInfos: null,
    emitterEmissionSignatureAuthor: temporaryStorage.signedBy,
    emitterEmissionSignatureDate: temporaryStorage.signedAt,
    packagings: temporaryStorage.wasteDetailsPackagingInfos,
    weightValue: temporaryStorage.wasteDetailsQuantity,
    wasteAdr: temporaryStorage.wasteDetailsOnuCode,
    weightIsEstimate:
      temporaryStorage.wasteDetailsQuantityType == QuantityType.ESTIMATED,
    transporterCompanyName: temporaryStorage.transporterCompanyName,
    transporterCompanySiret: temporaryStorage.transporterCompanySiret,
    transporterCompanyVatNumber: form.transporterCompanyVatNumber,
    transporterCompanyAddress: temporaryStorage.transporterCompanyAddress,
    transporterCompanyContact: temporaryStorage.transporterCompanyContact,
    transporterCompanyPhone: temporaryStorage.transporterCompanyPhone,
    transporterCompanyMail: temporaryStorage.transporterCompanyMail,
    transporterCustomInfo: temporaryStorage.transporterCustomInfo,
    transporterRecepisseIsExempted:
      temporaryStorage.transporterIsExemptedOfReceipt,
    transporterRecepisseNumber: temporaryStorage.transporterReceipt,
    transporterRecepisseDepartment: temporaryStorage.transporterDepartment,
    transporterRecepisseValidityLimit:
      temporaryStorage.transporterValidityLimit,
    transporterTransportMode: null,
    transporterNumberPlates: form.transporterNumberPlate
      ? [form.transporterNumberPlate]
      : [],
    transporterTransportTakenOverAt: temporaryStorage.signedAt,
    transporterTransportSignatureAuthor: temporaryStorage.signedBy,
    transporterTransportSignatureDate: temporaryStorage.signedAt,
    destinationCompanyName: temporaryStorage.destinationCompanyName,
    destinationCompanySiret: temporaryStorage.destinationCompanySiret,
    destinationCompanyAddress: temporaryStorage.destinationCompanyAddress,
    destinationCompanyContact: temporaryStorage.destinationCompanyContact,
    destinationCompanyPhone: temporaryStorage.destinationCompanyPhone,
    destinationCompanyMail: temporaryStorage.destinationCompanyMail,
    destinationCustomInfo: null,
    destinationReceptionDate: form.receivedAt,
    destinationReceptionWeight: form.quantityReceived,
    destinationReceptionAcceptationStatus: form.wasteAcceptationStatus,
    destinationReceptionRefusalReason: form.wasteRefusalReason,
    destinationReceptionSignatureAuthor: form.receivedBy,
    destinationReceptionSignatureDate: form.receivedAt,
    destinationPlannedOperationCode: form.recipientProcessingOperation,
    destinationOperationCode: form.processingOperationDone,
    destinationOperationSignatureAuthor: form.processedBy,
    destinationOperationSignatureDate: form.processedAt,
    destinationOperationDate: form.processedAt,
    destinationOperationNoTraceability: form.noTraceability,
    destinationCap: form.recipientCap,
    destinationOperationNextDestinationCompanyName:
      form.nextDestinationCompanyName,
    destinationOperationNextDestinationCompanySiret:
      form.nextDestinationCompanySiret,
    destinationOperationNextDestinationCompanyVatNumber: null,
    destinationOperationNextDestinationCompanyAddress:
      form.nextDestinationCompanyAddress,
    destinationOperationNextDestinationCompanyContact:
      form.nextDestinationCompanyContact,
    destinationOperationNextDestinationCompanyPhone:
      form.nextDestinationCompanyPhone,
    destinationOperationNextDestinationCompanyMail:
      form.nextDestinationCompanyMail
  };

  return {
    ...reexpedition,
    forwarding: {
      ...initial,
      grouping: form.appendix2Forms.map(f => simpleFormToBsdd(f))
    }
  };
}

export function formToBsdd(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  } & { transportSegments: TransportSegment[] }
): Bsdd & { grouping: Bsdd[] } & { forwarding: Bsdd & { grouping: Bsdd[] } } {
  let grouping: Bsdd[] = [];

  if (form.appendix2Forms) {
    grouping = form.appendix2Forms.map(f => simpleFormToBsdd(f));
  }

  if (form.temporaryStorageDetail) {
    return { ...formWithTempStorageToBsdd(form), grouping };
  } else {
    return { ...simpleFormToBsdd(form), forwarding: null, grouping };
  }
}
