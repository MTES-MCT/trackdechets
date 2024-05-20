import { BsddFinalOperation, QuantityType, Status } from "@prisma/client";
import {
  AppendixFormInput,
  InitialFormFractionInput
} from "../generated/graphql/types";
import { Bsdd } from "./types";
import { RegistryForm } from "../registry/elastic";

/**
 * Convert a simple form (without temporary storage) to a BSDD v2
 * @param form
 * @returns
 */
export function simpleFormToBsdd(
  form: Omit<RegistryForm, "grouping" | "forwarding" | "finalOperations">
): Bsdd {
  const transporters = (form.transporters ?? []).sort(
    (t1, t2) => t1.number - t2.number
  );

  const [transporter, transporter2, transporter3] = transporters;

  return {
    id: form.readableId,
    customId: form.customId,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    isDeleted: Boolean(form.isDeleted),
    isDraft: form.status == Status.DRAFT,
    status: form.status,
    forwardedInId: form.forwardedInId,
    wasteCode: form.wasteDetailsCode,
    wasteDescription: form.wasteDetailsName,
    wasteIsDangerous: form.wasteDetailsIsDangerous,
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
    emitterType: form.emitterType,
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
    weightValue: form.wasteDetailsQuantity
      ? form.wasteDetailsQuantity.toNumber()
      : null,
    wasteAdr: form.wasteDetailsOnuCode,
    weightIsEstimate: form.wasteDetailsQuantityType == QuantityType.ESTIMATED,
    transporterCompanyName: transporter?.transporterCompanyName,
    transporterCompanySiret: transporter?.transporterCompanySiret,
    transporterCompanyVatNumber: transporter?.transporterCompanyVatNumber,
    transporterCompanyAddress: transporter?.transporterCompanyAddress,
    transporterCompanyContact: transporter?.transporterCompanyContact,
    transporterCompanyPhone: transporter?.transporterCompanyPhone,
    transporterCompanyMail: transporter?.transporterCompanyMail,
    transporterCustomInfo: transporter?.transporterCustomInfo,
    transporterRecepisseIsExempted: transporter?.transporterIsExemptedOfReceipt,
    transporterRecepisseNumber: transporter?.transporterReceipt,
    transporterRecepisseDepartment: transporter?.transporterDepartment,
    transporterRecepisseValidityLimit: transporter?.transporterValidityLimit,
    transporterTransportMode: transporter?.transporterTransportMode,
    transporterTransportTakenOverAt: form.sentAt,
    transporterTransportSignatureAuthor: null,
    transporterTransportSignatureDate: form.sentAt,
    transporterNumberPlates: transporter?.transporterNumberPlate
      ? [transporter.transporterNumberPlate]
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
    transporter2TransportMode: transporter2?.transporterTransportMode,
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
    transporter3TransportMode: transporter3?.transporterTransportMode,
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
    destinationReceptionWeight: form.quantityReceived
      ? form.quantityReceived.toNumber()
      : null,
    destinationReceptionAcceptationStatus: form.wasteAcceptationStatus,
    destinationReceptionRefusalReason: form.wasteRefusalReason,
    destinationReceptionSignatureAuthor: form.receivedBy,
    destinationReceptionSignatureDate: form.receivedAt,
    destinationPlannedOperationCode: form.recipientProcessingOperation,
    destinationOperationCode: form.processingOperationDone,
    destinationOperationMode: form.destinationOperationMode,
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

export function formToBsdd(form: RegistryForm): Bsdd & {
  grouping: Bsdd[];
} & {
  forwarding: (Bsdd & { grouping: Bsdd[] }) | null;
} & {
  finalOperations: BsddFinalOperation[];
} {
  let grouping: Bsdd[] = [];

  if (form.grouping) {
    grouping = form.grouping.map(({ initialForm }) =>
      simpleFormToBsdd(initialForm)
    );
  }

  return {
    ...simpleFormToBsdd(form),
    ...(form.forwarding
      ? {
          forwarding: {
            ...simpleFormToBsdd(form.forwarding),
            grouping: []
          }
        }
      : { forwarding: null }),
    ...(form.finalOperations?.length
      ? {
          finalOperations: form.finalOperations
        }
      : { finalOperations: [] }),
    grouping
  };
}

export function appendix2toFormFractions(
  appendix2Forms: AppendixFormInput[]
): InitialFormFractionInput[] {
  return appendix2Forms.map(({ id }) => {
    return {
      form: { id }
    };
  });
}
