import { Bsda } from "@prisma/client";
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
import { getFirstTransporterSync, getTransportersSync } from "./database";
import { RegistryBsda } from "../registry/elastic";
import { BsdaForElastic } from "./elastic";

const getPostTempStorageDestination = (bsda: RegistryBsda) => {
  if (!bsda.forwardedIn) return {};

  const splittedAddress = splitAddress(
    bsda.forwardedIn.destinationCompanyAddress
  );

  return {
    postTempStorageDestinationName: bsda.forwardedIn.destinationCompanyName,
    postTempStorageDestinationSiret: bsda.forwardedIn.destinationCompanySiret,
    postTempStorageDestinationAddress: splittedAddress.street,
    postTempStorageDestinationPostalCode: splittedAddress.postalCode,
    postTempStorageDestinationCity: splittedAddress.city,
    // Always FR for now, as destination must be FR
    postTempStorageDestinationCountry: "FR"
  };
};

const getOperationData = (bsda: Bsda) => ({
  destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
  destinationOperationCode: bsda.destinationOperationCode,
  destinationOperationMode: bsda.destinationOperationMode
});

const getIntermediariesData = (bsda: RegistryBsda) => ({
  intermediary1CompanyName: bsda.intermediaries?.[0]?.name ?? null,
  intermediary1CompanySiret: bsda.intermediaries?.[0]?.siret ?? null,
  intermediary2CompanyName: bsda.intermediaries?.[1]?.name ?? null,
  intermediary2CompanySiret: bsda.intermediaries?.[1]?.siret ?? null,
  intermediary3CompanyName: bsda.intermediaries?.[2]?.name ?? null,
  intermediary3CompanySiret: bsda.intermediaries?.[2]?.siret ?? null
});

const getFinalOperationsData = (bsda: RegistryBsda) => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  // Check if finalOperations is defined and has elements
  if (bsda.finalOperations && bsda.finalOperations.length > 0) {
    // Iterate through each operation once and fill both arrays
    bsda.finalOperations.forEach(ope => {
      destinationFinalOperationCodes.push(ope.operationCode);
      destinationFinalOperationWeights.push(ope.quantity.toNumber());
    });
  }
  return { destinationFinalOperationCodes, destinationFinalOperationWeights };
};

const getTransportersData = (bsda: RegistryBsda): Partial<GenericWaste> => {
  const transporters = getTransportersSync(bsda);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;

  return {
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    transporterCompanyAddress: transporter?.transporterCompanyAddress,
    transporterCompanyName: transporter?.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    transporterRecepisseNumber: transporter?.transporterRecepisseNumber,
    transporterNumberPlates: transporter?.transporterTransportPlates,
    transporterCompanyMail: transporter?.transporterCompanyMail,
    transporterRecepisseIsExempted: transporter?.transporterRecepisseIsExempted,
    transporterTransportMode: transporter?.transporterTransportMode,
    transporter2CompanyAddress: transporter2?.transporterCompanyAddress,
    transporter2CompanyName: transporter2?.transporterCompanyName,
    transporter2CompanySiret: getTransporterCompanyOrgId(transporter2),
    transporter2RecepisseNumber: transporter2?.transporterRecepisseNumber,
    transporter2NumberPlates: transporter2?.transporterTransportPlates,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,
    transporter2RecepisseIsExempted:
      transporter2?.transporterRecepisseIsExempted,
    transporter2TransportMode: transporter2?.transporterTransportMode,
    transporter3CompanyAddress: transporter3?.transporterCompanyAddress,
    transporter3CompanyName: transporter3?.transporterCompanyName,
    transporter3CompanySiret: getTransporterCompanyOrgId(transporter3),
    transporter3RecepisseNumber: transporter3?.transporterRecepisseNumber,
    transporter3NumberPlates: transporter3?.transporterTransportPlates,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,
    transporter3RecepisseIsExempted:
      transporter3?.transporterRecepisseIsExempted,
    transporter3TransportMode: transporter3?.transporterTransportMode,
    transporter4CompanyAddress: transporter4?.transporterCompanyAddress,
    transporter4CompanyName: transporter4?.transporterCompanyName,
    transporter4CompanySiret: getTransporterCompanyOrgId(transporter4),
    transporter4RecepisseNumber: transporter4?.transporterRecepisseNumber,
    transporter4NumberPlates: transporter4?.transporterTransportPlates,
    transporter4CompanyMail: transporter4?.transporterCompanyMail,
    transporter4RecepisseIsExempted:
      transporter4?.transporterRecepisseIsExempted,
    transporter4TransportMode: transporter4?.transporterTransportMode,
    transporter5CompanyAddress: transporter5?.transporterCompanyAddress,
    transporter5CompanyName: transporter5?.transporterCompanyName,
    transporter5CompanySiret: getTransporterCompanyOrgId(transporter5),
    transporter5RecepisseNumber: transporter5?.transporterRecepisseNumber,
    transporter5NumberPlates: transporter5?.transporterTransportPlates,
    transporter5CompanyMail: transporter5?.transporterCompanyMail,
    transporter5RecepisseIsExempted:
      transporter5?.transporterRecepisseIsExempted,
    transporter5TransportMode: transporter5?.transporterTransportMode
  };
};

export function getRegistryFields(
  bsda: BsdaForElastic
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: [],
    isAllWasteFor: []
  };

  const transporter = getFirstTransporterSync(bsda);

  if (transporter?.transporterTransportSignatureDate) {
    registryFields.isOutgoingWasteFor = [
      bsda.emitterCompanySiret,
      bsda.ecoOrganismeSiret,
      bsda.workerCompanySiret
    ].filter(Boolean);

    registryFields.isAllWasteFor = [
      bsda.destinationCompanySiret,
      bsda.emitterCompanySiret,
      bsda.ecoOrganismeSiret,
      bsda.workerCompanySiret,
      bsda.brokerCompanySiret
    ].filter(Boolean);

    if (bsda.brokerCompanySiret) {
      registryFields.isManagedWasteFor.push(bsda.brokerCompanySiret);
    }

    if (bsda.intermediaries?.length) {
      for (const intermediary of bsda.intermediaries) {
        const intermediaryOrgId = intermediary.siret ?? intermediary.vatNumber;
        if (intermediaryOrgId) {
          registryFields.isManagedWasteFor.push(intermediaryOrgId);
          registryFields.isAllWasteFor.push(intermediaryOrgId);
        }
      }
    }
  }

  for (const transporter of bsda.transporters ?? []) {
    if (transporter.transporterTransportSignatureDate) {
      const transporterCompanyOrgId = getTransporterCompanyOrgId(transporter);
      if (transporterCompanyOrgId) {
        registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
        registryFields.isAllWasteFor.push(transporterCompanyOrgId);
      }
    }
  }

  // There is no signature at reception on the BSDA so we use the operation signature
  if (bsda.destinationOperationSignatureDate && bsda.destinationCompanySiret) {
    registryFields.isIncomingWasteFor.push(bsda.destinationCompanySiret);
  }

  return registryFields;
}

export const getSubType = (bsda: RegistryBsda): BsdSubType => {
  if (bsda.type === "OTHER_COLLECTIONS") {
    return "INITIAL";
  }

  return bsda.type;
};

function toGenericWaste(bsda: RegistryBsda): GenericWaste {
  return {
    wasteDescription: bsda.wasteMaterialName,
    wasteCode: bsda.wasteCode,
    wasteIsDangerous: true,
    pop: false,
    id: bsda.id,
    createdAt: bsda.createdAt,
    updatedAt: bsda.updatedAt,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiren: bsda.ecoOrganismeSiret?.slice(0, 9),
    bsdType: "BSDA",
    bsdSubType: getSubType(bsda),
    status: bsda.status,
    customId: null,
    destinationCap: bsda.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsda.destinationOperationDate,
    destinationReceptionWeight: bsda.destinationReceptionWeight
      ? bsda.destinationReceptionWeight.dividedBy(1000).toNumber()
      : null,

    wasteAdr: bsda.wasteAdr,
    workerCompanyName: bsda.workerCompanyName,
    workerCompanySiret: bsda.workerCompanySiret,
    workerCompanyAddress: bsda.workerCompanyAddress,
    ...getTransportersData(bsda),
    destinationCompanyMail: bsda.destinationCompanyMail,
    brokerCompanyMail: bsda.brokerCompanyMail
  };
}

export function toIncomingWaste(bsda: RegistryBsda): Required<IncomingWaste> {
  const initialEmitter: Pick<
    IncomingWaste,
    | "initialEmitterCompanyAddress"
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsda.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsda.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationReceptionDate: bsda.destinationReceptionDate,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    ...initialEmitter,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: null,
    emitterCompanyMail: bsda.emitterCompanyMail,
    ...getOperationData(bsda),
    nextDestinationProcessingOperation:
      bsda.destinationOperationNextDestinationPlannedOperationCode
  };
}

export function toOutgoingWaste(bsda: RegistryBsda): Required<OutgoingWaste> {
  const initialEmitter: Pick<
    OutgoingWaste,
    | "initialEmitterCompanyAddress"
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsda.forwarding) {
    initialEmitter.initialEmitterCompanyAddress =
      bsda.forwarding.emitterCompanyAddress;
    initialEmitter.initialEmitterCompanyName =
      bsda.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsda.forwarding.emitterCompanySiret;
  }

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyOutgoingWaste,
    ...genericWaste,
    ...getPostTempStorageDestination(bsda),
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    ...initialEmitter,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    weight: bsda.weightValue
      ? bsda.weightValue.dividedBy(1000).toNumber()
      : null,
    ...getOperationData(bsda),
    ...getFinalOperationsData(bsda),
    nextDestinationProcessingOperation:
      bsda.destinationOperationNextDestinationPlannedOperationCode
  };
}

export function toTransportedWaste(
  bsda: RegistryBsda
): Required<TransportedWaste> {
  const initialEmitter: Pick<
    TransportedWaste,
    | "initialEmitterCompanyAddress"
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsda.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsda.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsda.destinationReceptionDate,
    weight: bsda.weightValue
      ? bsda.weightValue.dividedBy(1000).toNumber()
      : null,
    ...initialEmitter,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    emitterCompanyMail: bsda.emitterCompanyMail
  };
}

export function toManagedWaste(bsda: RegistryBsda): Required<ManagedWaste> {
  const initialEmitter: Pick<
    ManagedWaste,
    | "initialEmitterCompanyAddress"
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsda.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsda.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
    ...genericWaste,
    managedStartDate: null,
    managedEndDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    ...initialEmitter,
    emitterCompanyMail: bsda.emitterCompanyMail,
    destinationCompanyMail: bsda.destinationCompanyMail,
    nextDestinationProcessingOperation:
      bsda.destinationOperationNextDestinationPlannedOperationCode
  };
}

export function toAllWaste(bsda: RegistryBsda): Required<AllWaste> {
  const initialEmitter: Pick<
    AllWaste,
    | "initialEmitterCompanyAddress"
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsda.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsda.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyAllWaste,
    ...genericWaste,
    ...getPostTempStorageDestination(bsda),
    createdAt: bsda.createdAt,
    destinationReceptionDate: bsda.destinationReceptionDate,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    ...initialEmitter,
    weight: bsda.weightValue
      ? bsda.weightValue.dividedBy(1000).toNumber()
      : null,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsda.emitterCompanyMail,
    ...getOperationData(bsda),
    ...getFinalOperationsData(bsda),
    nextDestinationProcessingOperation:
      bsda.destinationOperationNextDestinationPlannedOperationCode,
    ...getIntermediariesData(bsda)
  };
}
