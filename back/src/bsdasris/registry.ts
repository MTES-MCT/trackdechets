import { Bsdasri } from "@prisma/client";
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
import { getWasteDescription } from "./utils";
import { RegistryBsdasri } from "../registry/elastic";
import { splitAddress } from "../common/addresses";

const getOperationData = (bsdasri: Bsdasri) => ({
  destinationPlannedOperationCode: bsdasri.destinationOperationCode,
  destinationOperationCode: bsdasri.destinationOperationCode,
  destinationOperationMode: bsdasri.destinationOperationMode
});

const getFinalOperationsData = (bsdasri: RegistryBsdasri) => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  // Check if finalOperations is defined and has elements
  if (bsdasri.finalOperations && bsdasri.finalOperations.length > 0) {
    // Iterate through each operation once and fill both arrays
    bsdasri.finalOperations.forEach(ope => {
      destinationFinalOperationCodes.push(ope.operationCode);
      destinationFinalOperationWeights.push(ope.quantity.toNumber());
    });
  }
  return { destinationFinalOperationCodes, destinationFinalOperationWeights };
};

const getInitialEmitterData = () => {
  const initialEmitter: Record<string, string | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  return initialEmitter;
};

export const getTransporterData = (bsdasri: Bsdasri, includePlates = false) => {
  const {
    street: transporterCompanyAddress,
    postalCode: transporterCompanyPostalCode,
    city: transporterCompanyCity,
    country: transporterCompanyCountry
  } = splitAddress(
    bsdasri.transporterCompanyAddress,
    bsdasri.transporterCompanyVatNumber
  );

  const data = {
    transporterRecepisseIsExempted: bsdasri.transporterRecepisseIsExempted,
    transporterCompanyAddress,
    transporterCompanyPostalCode,
    transporterCompanyCity,
    transporterCompanyCountry,
    transporterCompanyName: bsdasri.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(bsdasri),
    transporterRecepisseNumber: bsdasri.transporterRecepisseNumber,
    transporterCompanyMail: bsdasri.transporterCompanyMail,
    transporterCustomInfo: bsdasri.transporterCustomInfo,
    transporterTakenOverAt: bsdasri.transporterTakenOverAt,
    transporterTransportMode: bsdasri.transporterTransportMode
  };

  if (includePlates) {
    return {
      ...data,
      transporterNumberPlates: bsdasri.transporterTransportPlates ?? null
    };
  }

  return data;
};

export function getRegistryFields(
  bsdasri: Bsdasri
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: [],
    isAllWasteFor: []
  };

  if (bsdasri.transporterTransportSignatureDate) {
    if (bsdasri.destinationCompanySiret) {
      registryFields.isAllWasteFor.push(bsdasri.destinationCompanySiret);
    }
    if (bsdasri.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsdasri.emitterCompanySiret);
      registryFields.isAllWasteFor.push(bsdasri.emitterCompanySiret);
    }
    if (bsdasri.ecoOrganismeSiret) {
      registryFields.isOutgoingWasteFor.push(bsdasri.ecoOrganismeSiret);
      registryFields.isAllWasteFor.push(bsdasri.ecoOrganismeSiret);
    }
    const transporterCompanyOrgId = getTransporterCompanyOrgId(bsdasri);
    if (transporterCompanyOrgId) {
      registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
      registryFields.isAllWasteFor.push(transporterCompanyOrgId);
    }
  }

  if (
    bsdasri.destinationReceptionSignatureDate &&
    bsdasri.destinationCompanySiret
  ) {
    registryFields.isIncomingWasteFor.push(bsdasri.destinationCompanySiret);
  }

  return registryFields;
}

export const getSubType = (bsdasri: Bsdasri): BsdSubType => {
  switch (bsdasri.type) {
    case "SIMPLE":
      return "INITIAL";
    case "SYNTHESIS":
      return "SYNTHESIS";
    case "GROUPING":
      return "GATHERING";
  }
};

export function toGenericWaste(bsdasri: Bsdasri): GenericWaste {
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsdasri.destinationCompanyAddress);

  return {
    wasteDescription: bsdasri.wasteCode
      ? getWasteDescription(bsdasri.wasteCode)
      : "",
    wasteCode: bsdasri.wasteCode,
    wasteIsDangerous: true,
    pop: false,
    id: bsdasri.id,
    createdAt: bsdasri.createdAt,
    updatedAt: bsdasri.updatedAt,
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    ecoOrganismeSiren: bsdasri.ecoOrganismeSiret?.slice(0, 9),
    bsdType: "BSDASRI",
    bsdSubType: getSubType(bsdasri),
    status: bsdasri.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsdasri.destinationOperationDate,
    destinationReceptionWeight: bsdasri.destinationReceptionWasteWeightValue
      ? bsdasri.destinationReceptionWasteWeightValue.dividedBy(1000).toNumber()
      : null,
    wasteAdr: bsdasri.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret
  };
}

export function toIncomingWaste(
  bsdasri: RegistryBsdasri
): Required<IncomingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri),
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterPickupsiteName: bsdasri.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdasri.emitterPickupSiteAddress,
      bsdasri.emitterPickupSitePostalCode,
      bsdasri.emitterPickupSiteCity
    ]),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    ...getOperationData(bsdasri),
    ...getInitialEmitterData()
  };
}

export function toOutgoingWaste(
  bsdasri: RegistryBsdasri
): Required<OutgoingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyOutgoingWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri),
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterPickupsiteName: bsdasri.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdasri.emitterPickupSiteAddress,
      bsdasri.emitterPickupSitePostalCode,
      bsdasri.emitterPickupSiteCity
    ]),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue.dividedBy(1000).toNumber()
      : null,
    ...getOperationData(bsdasri),
    ...getFinalOperationsData(bsdasri),
    ...getInitialEmitterData()
  };
}

export function toTransportedWaste(
  bsdasri: RegistryBsdasri
): Required<TransportedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri, true),
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue.dividedBy(1000).toNumber()
      : null,
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterPickupsiteName: bsdasri.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdasri.emitterPickupSiteAddress,
      bsdasri.emitterPickupSitePostalCode,
      bsdasri.emitterPickupSiteCity
    ]),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    emitterCompanyMail: bsdasri.emitterCompanyMail
  };
}

/**
 * BSDASRI has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(
  bsdasri: RegistryBsdasri
): Required<ManagedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri),
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterPickupsiteName: bsdasri.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdasri.emitterPickupSiteAddress,
      bsdasri.emitterPickupSitePostalCode,
      bsdasri.emitterPickupSiteCity
    ]),
    emitterCompanyMail: bsdasri.emitterCompanyMail
  };
}

export function toAllWaste(bsdasri: RegistryBsdasri): Required<AllWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyAllWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri, true),
    createdAt: bsdasri.createdAt,
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterPickupsiteName: bsdasri.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdasri.emitterPickupSiteAddress,
      bsdasri.emitterPickupSitePostalCode,
      bsdasri.emitterPickupSiteCity
    ]),
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue.dividedBy(1000).toNumber()
      : null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    ...getOperationData(bsdasri),
    ...getFinalOperationsData(bsdasri),
    ...getInitialEmitterData()
  };
}
