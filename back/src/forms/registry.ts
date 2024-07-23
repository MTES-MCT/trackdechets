import { BsddFinalOperation } from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import { BsdElastic } from "../common/elastic";
import { buildAddress } from "../companies/sirene/utils";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import {
  GenericWaste,
  RegistryFields,
  emptyAllWaste,
  emptyIncomingWaste,
  emptyManagedWaste,
  emptyOutgoingWaste,
  emptyTransportedWaste
} from "../registry/types";
import { splitAddress } from "../utils";
import { Bsdd } from "./types";
import { FormForElastic } from "./elastic";
import { formToBsdd } from "./compat";
import { getBsddSubType } from "../common/subTypes";

const getPostTempStorageDestination = (bsdd: ReturnType<typeof formToBsdd>) => {
  if (!bsdd.forwardedIn) return {};

  const splittedAddress = splitAddress(
    bsdd.forwardedIn.destinationCompanyAddress
  );

  return {
    postTempStorageDestinationName: bsdd.forwardedIn.destinationCompanyName,
    postTempStorageDestinationSiret: bsdd.forwardedIn.destinationCompanySiret,
    postTempStorageDestinationAddress: splittedAddress.street,
    postTempStorageDestinationPostalCode: splittedAddress.postalCode,
    postTempStorageDestinationCity: splittedAddress.city,
    // Always FR for now, as destination must be FR
    postTempStorageDestinationCountry: "FR"
  };
};

const getOperationData = (bsdd: Bsdd) => ({
  destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
  destinationOperationCode: bsdd.destinationOperationCode,
  destinationOperationMode: bsdd.destinationOperationMode
});

const getTransportersData = (bsdd: Bsdd, includePlates = false) => {
  const data = {
    transporterRecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    transporterCompanyAddress: bsdd.transporterCompanyAddress,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret?.length
      ? bsdd.transporterCompanySiret
      : bsdd.transporterCompanyVatNumber,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    transporterTransportMode: bsdd.transporterTransportMode,
    transporterCompanyMail: bsdd.transporterCompanyMail,
    transporter2CompanyAddress: bsdd.transporter2CompanyAddress ?? null,
    transporter2CompanyName: bsdd.transporter2CompanyName ?? null,
    transporter2CompanySiret:
      (bsdd.transporter2CompanySiret?.length
        ? bsdd.transporter2CompanySiret
        : bsdd.transporter2CompanyVatNumber) ?? null,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber ?? null,
    transporter2CompanyMail: bsdd.transporter2CompanyMail ?? null,
    transporter2TransportMode: bsdd.transporter2TransportMode ?? null,
    transporter3CompanyAddress: bsdd.transporter3CompanyAddress ?? null,
    transporter3CompanyName: bsdd.transporter3CompanyName ?? null,
    transporter3CompanySiret:
      (bsdd.transporter3CompanySiret?.length
        ? bsdd.transporter3CompanySiret
        : bsdd.transporter3CompanyVatNumber) ?? null,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber ?? null,
    transporter3CompanyMail: bsdd.transporter3CompanyMail ?? null,
    transporter3TransportMode: bsdd.transporter3TransportMode ?? null,
    transporter4CompanyAddress: bsdd.transporter4CompanyAddress ?? null,
    transporter4CompanyName: bsdd.transporter4CompanyName ?? null,
    transporter4CompanySiret:
      (bsdd.transporter4CompanySiret?.length
        ? bsdd.transporter4CompanySiret
        : bsdd.transporter4CompanyVatNumber) ?? null,
    transporter4RecepisseNumber: bsdd.transporter4RecepisseNumber ?? null,
    transporter4CompanyMail: bsdd.transporter4CompanyMail ?? null,
    transporter4TransportMode: bsdd.transporter4TransportMode ?? null,
    transporter5CompanyAddress: bsdd.transporter5CompanyAddress ?? null,
    transporter5CompanyName: bsdd.transporter5CompanyName ?? null,
    transporter5CompanySiret:
      (bsdd.transporter5CompanySiret?.length
        ? bsdd.transporter5CompanySiret
        : bsdd.transporter5CompanyVatNumber) ?? null,
    transporter5RecepisseNumber: bsdd.transporter5RecepisseNumber ?? null,
    transporter5CompanyMail: bsdd.transporter5CompanyMail ?? null,
    transporter5TransportMode: bsdd.transporter5TransportMode ?? null
  };

  if (includePlates) {
    return {
      ...data,
      transporterNumberPlates: bsdd.transporterNumberPlates ?? null,
      transporter2NumberPlates: bsdd.transporter2NumberPlates ?? null,
      transporter3NumberPlates: bsdd.transporter3NumberPlates ?? null,
      transporter4NumberPlates: bsdd.transporter4NumberPlates ?? null,
      transporter5NumberPlates: bsdd.transporter5NumberPlates ?? null
    };
  }

  return data;
};

const getIntermediariesData = (bsdd: ReturnType<typeof formToBsdd>) => ({
  intermediary1CompanyName: bsdd.intermediaries?.[0]?.name ?? null,
  intermediary1CompanySiret: bsdd.intermediaries?.[0]?.siret ?? null,
  intermediary2CompanyName: bsdd.intermediaries?.[1]?.name ?? null,
  intermediary2CompanySiret: bsdd.intermediaries?.[1]?.siret ?? null,
  intermediary3CompanyName: bsdd.intermediaries?.[2]?.name ?? null,
  intermediary3CompanySiret: bsdd.intermediaries?.[2]?.siret ?? null
});

export function getRegistryFields(
  form: FormForElastic
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: [],
    isAllWasteFor: []
  };

  if (form.receivedAt) {
    if (form.recipientCompanySiret) {
      registryFields.isIncomingWasteFor.push(form.recipientCompanySiret);
    }
  }

  if (form.sentAt) {
    registryFields.isAllWasteFor = [
      form.recipientCompanySiret,
      form.emitterCompanySiret,
      form.ecoOrganismeSiret,
      form.traderCompanySiret,
      form.brokerCompanySiret
    ].filter(Boolean);

    registryFields.isOutgoingWasteFor = [
      form.emitterCompanySiret,
      form.ecoOrganismeSiret
    ].filter(Boolean);

    registryFields.isManagedWasteFor = [
      form.traderCompanySiret,
      form.brokerCompanySiret
    ].filter(Boolean);

    if (form.intermediaries?.length) {
      for (const intermediary of form.intermediaries) {
        const intermediaryOrgId = intermediary.siret ?? intermediary.vatNumber;
        if (intermediaryOrgId) {
          registryFields.isManagedWasteFor.push(intermediaryOrgId);
          registryFields.isAllWasteFor.push(intermediaryOrgId);
        }
      }
    }
  }

  for (const transporter of form.transporters ?? []) {
    if (transporter.takenOverAt) {
      const transporterCompanyOrgId = getTransporterCompanyOrgId(transporter);
      if (transporterCompanyOrgId) {
        registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
        registryFields.isAllWasteFor.push(transporterCompanyOrgId);
      }
    }
  }

  return registryFields;
}

/**
 * Return finalOperations
 * maintaining the order
 */
const getFinalOperationsData = (
  bsdd: Bsdd & {
    finalOperations: BsddFinalOperation[];
  }
): Pick<
  OutgoingWaste | AllWaste,
  "destinationFinalOperationCodes" | "destinationFinalOperationWeights"
> => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  // Check if finalOperations is defined and has elements
  if (bsdd.finalOperations && bsdd.finalOperations.length > 0) {
    // Iterate through each operation once and fill both arrays
    bsdd.finalOperations.forEach(ope => {
      destinationFinalOperationCodes.push(ope.operationCode);
      destinationFinalOperationWeights.push(ope.quantity.toNumber());
    });
  }
  return { destinationFinalOperationCodes, destinationFinalOperationWeights };
};

export function toGenericWaste(
  bsdd: ReturnType<typeof formToBsdd>
): GenericWaste {
  const initialEmitter: Record<string, string | string[] | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  // Bsd suite. Fill initial emitter data.
  if (bsdd.forwarding) {
    initialEmitter.initialEmitterCompanyAddress =
      bsdd.forwarding.emitterCompanyAddress;
    initialEmitter.initialEmitterCompanyName =
      bsdd.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsdd.forwarding.emitterCompanySiret;
  }

  return {
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    wasteIsDangerous: bsdd.wasteIsDangerous,
    pop: bsdd.pop,
    id: bsdd.id,
    createdAt: bsdd.createdAt,
    updatedAt: bsdd.updatedAt,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    ecoOrganismeSiren: bsdd.ecoOrganismeSiret?.slice(0, 9),
    bsdType: "BSDD",
    bsdSubType: getBsddSubType(bsdd),
    status: bsdd.status,
    customId: bsdd.customId,
    destinationCap: bsdd.destinationCap,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsdd.destinationOperationDate,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    wasteAdr: bsdd.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    brokerCompanyMail: bsdd.brokerCompanyMail,
    traderCompanyMail: bsdd.traderCompanyMail,
    parcelCities: bsdd.parcelCities,
    parcelPostalCodes: bsdd.parcelPostalCodes,
    parcelNumbers: bsdd.parcelNumbers,
    parcelCoordinates: bsdd.parcelCoordinates,
    ...initialEmitter
  };
}

export function toIncomingWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<IncomingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    ...getOperationData(bsdd),
    nextDestinationNotificationNumber: bsdd.nextDestinationNotificationNumber,
    nextDestinationProcessingOperation: bsdd.nextDestinationProcessingOperation,
    ...getTransportersData(bsdd)
  };
}

export function toOutgoingWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<OutgoingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyOutgoingWaste,
    ...genericWaste,
    ...getPostTempStorageDestination(bsdd),
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    weight: bsdd.weightValue,
    ...getOperationData(bsdd),
    ...getFinalOperationsData(bsdd),
    nextDestinationNotificationNumber: bsdd.nextDestinationNotificationNumber,
    nextDestinationProcessingOperation: bsdd.nextDestinationProcessingOperation,
    ...getTransportersData(bsdd)
  };
}

export function toTransportedWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<TransportedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    weight: bsdd.weightValue,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    ...getTransportersData(bsdd, true)
  };
}

export function toManagedWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<ManagedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
    ...genericWaste,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    nextDestinationNotificationNumber: bsdd.nextDestinationNotificationNumber,
    nextDestinationProcessingOperation: bsdd.nextDestinationProcessingOperation,
    ...getTransportersData(bsdd)
  };
}

export function toAllWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<AllWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyAllWaste,
    ...genericWaste,
    ...getPostTempStorageDestination(bsdd),
    createdAt: bsdd.createdAt,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    weight: bsdd.weightValue,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    ...getOperationData(bsdd),
    ...getFinalOperationsData(bsdd),
    nextDestinationNotificationNumber: bsdd.nextDestinationNotificationNumber,
    nextDestinationProcessingOperation: bsdd.nextDestinationProcessingOperation,
    ...getIntermediariesData(bsdd),
    ...getTransportersData(bsdd, true)
  };
}
