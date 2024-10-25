import {
  IntermediaryFormAssociation,
  QuantityType,
  Status
} from "@prisma/client";
import {
  AppendixFormInput,
  InitialFormFractionInput,
  ParcelNumber
} from "../generated/graphql/types";
import { Bsdd } from "./types";
import { RegistryForm } from "../registry/elastic";
import { bsddWasteQuantities } from "./helpers/bsddWasteQuantities";

/**
 * Convert a simple form (without temporary storage) to a BSDD v2
 * @param form
 * @returns
 */
export function simpleFormToBsdd(
  form: Omit<
    RegistryForm,
    | "grouping"
    | "forwarding"
    | "finalOperations"
    | "intermediaries"
    | "forwardedIn"
  >
): Bsdd {
  const transporters = (form.transporters ?? []).sort(
    (t1, t2) => t1.number - t2.number
  );

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;

  const parcels = form.wasteDetailsParcelNumbers as ParcelNumber[] | null;

  const wasteQuantities = bsddWasteQuantities(form);

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
    nonRoadRegulationMention: form.wasteDetailsNonRoadRegulationMention,
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
    transporter2CompanyVatNumber: transporter2?.transporterCompanyVatNumber,
    transporter2CompanyAddress: transporter2?.transporterCompanyAddress,
    transporter2CompanyContact: transporter2?.transporterCompanyContact,
    transporter2CompanyPhone: transporter2?.transporterCompanyPhone,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,
    transporter2CustomInfo: transporter2?.transporterCustomInfo,
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
    transporter3CompanyVatNumber: transporter3?.transporterCompanyVatNumber,
    transporter3CompanyAddress: transporter3?.transporterCompanyAddress,
    transporter3CompanyContact: transporter3?.transporterCompanyContact,
    transporter3CompanyPhone: transporter3?.transporterCompanyPhone,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,
    transporter3CustomInfo: transporter3?.transporterCustomInfo,
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

    transporter4CompanyName: transporter4?.transporterCompanyName,
    transporter4CompanySiret: transporter4?.transporterCompanySiret,
    transporter4CompanyVatNumber: transporter4?.transporterCompanyVatNumber,
    transporter4CompanyAddress: transporter4?.transporterCompanyAddress,
    transporter4CompanyContact: transporter4?.transporterCompanyContact,
    transporter4CompanyPhone: transporter4?.transporterCompanyPhone,
    transporter4CompanyMail: transporter4?.transporterCompanyMail,
    transporter4CustomInfo: transporter4?.transporterCustomInfo,
    transporter4RecepisseIsExempted:
      transporter4?.transporterIsExemptedOfReceipt,
    transporter4RecepisseNumber: transporter4?.transporterReceipt,
    transporter4RecepisseDepartment: transporter4?.transporterDepartment,
    transporter4RecepisseValidityLimit: transporter4?.transporterValidityLimit,
    transporter4TransportMode: transporter4?.transporterTransportMode,
    transporter4TransportTakenOverAt: transporter4?.takenOverAt,
    transporter4TransportSignatureAuthor: transporter4?.takenOverBy,
    transporter4TransportSignatureDate: transporter4?.takenOverAt,
    transporter4NumberPlates: transporter4?.transporterNumberPlate
      ? [transporter4.transporterNumberPlate]
      : [],

    transporter5CompanyName: transporter5?.transporterCompanyName,
    transporter5CompanySiret: transporter5?.transporterCompanySiret,
    transporter5CompanyVatNumber: transporter5?.transporterCompanyVatNumber,
    transporter5CompanyAddress: transporter5?.transporterCompanyAddress,
    transporter5CompanyContact: transporter5?.transporterCompanyContact,
    transporter5CompanyPhone: transporter5?.transporterCompanyPhone,
    transporter5CompanyMail: transporter5?.transporterCompanyMail,
    transporter5CustomInfo: transporter5?.transporterCustomInfo,
    transporter5RecepisseIsExempted:
      transporter5?.transporterIsExemptedOfReceipt,
    transporter5RecepisseNumber: transporter5?.transporterReceipt,
    transporter5RecepisseDepartment: transporter5?.transporterDepartment,
    transporter5RecepisseValidityLimit: transporter5?.transporterValidityLimit,
    transporter5TransportMode: transporter5?.transporterTransportMode,
    transporter5TransportTakenOverAt: transporter5?.takenOverAt,
    transporter5TransportSignatureAuthor: transporter5?.takenOverBy,
    transporter5TransportSignatureDate: transporter5?.takenOverAt,
    transporter5NumberPlates: transporter5?.transporterNumberPlate
      ? [transporter5.transporterNumberPlate]
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
    destinationReceptionAcceptedWeight: wasteQuantities?.quantityAccepted
      ? wasteQuantities?.quantityAccepted.toNumber()
      : null,
    destinationReceptionRefusedWeight: wasteQuantities?.quantityRefused
      ? wasteQuantities?.quantityRefused.toNumber()
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
    destinationHasCiterneBeenWashedOut: form.hasCiterneBeenWashedOut,
    destinationCiterneNotWashedOutReason: form.citerneNotWashedOutReason,
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
      form.nextDestinationCompanyMail,
    nextDestinationNotificationNumber: form.nextDestinationNotificationNumber,
    nextDestinationProcessingOperation: form.nextDestinationProcessingOperation,
    parcelCities: parcels?.length ? parcels.map(parcel => parcel.city) : null,
    parcelPostalCodes: parcels?.length
      ? parcels.map(parcel => parcel.postalCode)
      : null,
    parcelNumbers: parcels?.length
      ? parcels.map(parcel => {
          if (parcel.prefix && parcel.section && parcel.number) {
            return `${parcel.prefix}-${parcel.section}-${parcel.number}`;
          }
          return null;
        })
      : null,
    parcelCoordinates: parcels?.length
      ? parcels.map(parcel => {
          if (typeof parcel.x === "number" && typeof parcel.y === "number") {
            return `N ${parcel.x} E ${parcel.y}`;
          }
          return null;
        })
      : null
  };
}

export function formToBsdd(form: RegistryForm): Bsdd & {
  grouping: Bsdd[];
} & {
  forwardedIn: (Bsdd & { grouping: Bsdd[] }) | null;
} & {
  forwarding: (Bsdd & { grouping: Bsdd[] }) | null;
} & Pick<RegistryForm, "finalOperations"> & {
    intermediaries: IntermediaryFormAssociation[] | null;
  } {
  let grouping: Bsdd[] = [];

  if (form.grouping) {
    grouping = form.grouping.map(({ initialForm }) =>
      simpleFormToBsdd(initialForm)
    );
  }

  return {
    ...simpleFormToBsdd(form),
    ...(form.forwardedIn
      ? {
          forwardedIn: {
            ...simpleFormToBsdd(form.forwardedIn),
            grouping: []
          }
        }
      : { forwardedIn: null }),
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
    ...(form.intermediaries
      ? {
          intermediaries: form.intermediaries
        }
      : { intermediaries: null }),
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
