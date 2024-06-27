import { BsddFinalOperation } from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import { BsdElastic } from "../common/elastic";
import { buildAddress } from "../companies/sirene/utils";
import {
  AllWaste,
  BsdSubType,
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
import { extractPostalCode, splitAddress } from "../utils";
import { Bsdd } from "./types";
import { FormForElastic } from "./elastic";
import { formToBsdd } from "./compat";

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

const getTransportersData = (bsdd: Bsdd) => ({
  transporterRecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
  transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
  transporterCompanyAddress: bsdd.transporterCompanyAddress,
  transporterCompanyName: bsdd.transporterCompanyName,
  transporterCompanySiret: bsdd.transporterCompanySiret,
  transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
  transporterNumberPlates: bsdd.transporterNumberPlates,
  transporterTransportMode: bsdd.transporterTransportMode,
  transporterCompanyMail: bsdd.transporterCompanyMail,
  transporter2CompanyAddress: bsdd.transporter2CompanyAddress,
  transporter2CompanyName: bsdd.transporter2CompanyName,
  transporter2CompanySiret: bsdd.transporter2CompanySiret,
  transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber,
  transporter2NumberPlates: bsdd.transporter2NumberPlates,
  transporter2CompanyMail: bsdd.transporter2CompanyMail,
  transporter2TransportMode: bsdd.transporter2TransportMode,
  transporter3CompanyAddress: bsdd.transporter3CompanyAddress,
  transporter3CompanyName: bsdd.transporter3CompanyName,
  transporter3CompanySiret: bsdd.transporter3CompanySiret,
  transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber,
  transporter3NumberPlates: bsdd.transporter3NumberPlates,
  transporter3CompanyMail: bsdd.transporter3CompanyMail,
  transporter3TransportMode: bsdd.transporter3TransportMode,
  transporter4CompanyAddress: bsdd.transporter4CompanyAddress,
  transporter4CompanyName: bsdd.transporter4CompanyName,
  transporter4CompanySiret: bsdd.transporter4CompanySiret,
  transporter4RecepisseNumber: bsdd.transporter4RecepisseNumber,
  transporter4NumberPlates: bsdd.transporter4NumberPlates,
  transporter4CompanyMail: bsdd.transporter4CompanyMail,
  transporter4TransportMode: bsdd.transporter4TransportMode,
  transporter5CompanyAddress: bsdd.transporter5CompanyAddress,
  transporter5CompanyName: bsdd.transporter5CompanyName,
  transporter5CompanySiret: bsdd.transporter5CompanySiret,
  transporter5RecepisseNumber: bsdd.transporter5RecepisseNumber,
  transporter5NumberPlates: bsdd.transporter5NumberPlates,
  transporter5CompanyMail: bsdd.transporter5CompanyMail,
  transporter5TransportMode: bsdd.transporter5TransportMode
});

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

export const getSubType = (bsdd: Bsdd): BsdSubType => {
  if (bsdd.forwardedInId || bsdd.id.endsWith("-suite")) {
    return "TEMP_STORED";
  }

  if (bsdd.emitterType === "APPENDIX1") {
    return "TOURNEE";
  } else if (bsdd.emitterType === "APPENDIX1_PRODUCER") {
    return "APPENDIX1";
  } else if (bsdd.emitterType === "APPENDIX2") {
    return "APPENDIX2";
  }

  return "INITIAL";
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
    bsdSubType: getSubType(bsdd),
    status: bsdd.status,
    customId: bsdd.customId,
    destinationCap: bsdd.destinationCap,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsdd.destinationOperationDate,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    wasteAdr: bsdd.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    weight: bsdd.weightValue,
    brokerCompanyMail: bsdd.brokerCompanyMail,
    traderCompanyMail: bsdd.traderCompanyMail,
    parcelCities: bsdd.parcelCities,
    parcelPostalCodes: bsdd.parcelPostalCodes,
    parcelNumbers: bsdd.parcelNumbers,
    parcelCoordinates: bsdd.parcelCoordinates,
    ...getTransportersData(bsdd),
    ...initialEmitter
  };
}

export function toIncomingWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<IncomingWaste> {
  const initialEmitter: Record<string, string | string[] | null> = {
    initialEmitterPostalCodes: null
  };

  if (bsdd.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsdd.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    ...initialEmitter,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCustomInfo: null,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    ...getOperationData(bsdd),
    nextDestinationNotificationNumber: bsdd.nextDestinationNotificationNumber,
    nextDestinationProcessingOperation: bsdd.nextDestinationProcessingOperation
  };
}

export function toOutgoingWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<OutgoingWaste> {
  const initialEmitter: Record<string, string | string[] | null> = {
    initialEmitterPostalCodes: null
  };

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

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
    ...initialEmitter,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    emitterCustomInfo: null,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    ...getOperationData(bsdd),
    ...getFinalOperationsData(bsdd),
    nextDestinationNotificationNumber: bsdd.nextDestinationNotificationNumber,
    nextDestinationProcessingOperation: bsdd.nextDestinationProcessingOperation
  };
}

export function toTransportedWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<TransportedWaste> {
  const initialEmitter: Record<string, string[] | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsdd.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsdd.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    ...initialEmitter,
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
    emitterCompanyMail: bsdd.emitterCompanyMail
  };
}

export function toManagedWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<ManagedWaste> {
  const initialEmitter: Record<string, string[] | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsdd.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsdd.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
    ...genericWaste,
    managedStartDate: null,
    managedEndDate: null,
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
    ...initialEmitter,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    nextDestinationNotificationNumber: bsdd.nextDestinationNotificationNumber,
    nextDestinationProcessingOperation: bsdd.nextDestinationProcessingOperation
  };
}

export function toAllWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<AllWaste> {
  const initialEmitter: Record<string, string[] | null> = {
    initialEmitterPostalCodes: null
  };

  if (bsdd.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsdd.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

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
    ...initialEmitter,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    ...getOperationData(bsdd),
    ...getFinalOperationsData(bsdd),
    nextDestinationNotificationNumber: bsdd.nextDestinationNotificationNumber,
    nextDestinationProcessingOperation: bsdd.nextDestinationProcessingOperation,
    ...getIntermediariesData(bsdd)
  };
}
