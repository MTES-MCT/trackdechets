import { Bsdasri } from "@prisma/client";
import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
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
  emptyAllWaste,
  emptyIncomingWaste,
  emptyManagedWaste,
  emptyOutgoingWaste,
  emptyTransportedWaste
} from "../registry/types";
import { extractPostalCode } from "../utils";
import { getWasteDescription } from "./utils";

const getOperationData = (bsdasri: Bsdasri) => ({
  destinationPlannedOperationCode: bsdasri.destinationOperationCode,
  destinationOperationCode: bsdasri.destinationOperationCode,
  destinationOperationMode: bsdasri.destinationOperationMode
});

const getTransporterData = (bsdasri: Bsdasri) => ({
  transporterRecepisseIsExempted: bsdasri.transporterRecepisseIsExempted,
  transporterNumberPlates: bsdasri.transporterTransportPlates,
  transporterCompanyAddress: bsdasri.transporterCompanyAddress,
  transporterCompanyName: bsdasri.transporterCompanyName,
  transporterCompanySiret: getTransporterCompanyOrgId(bsdasri),
  transporterRecepisseNumber: bsdasri.transporterRecepisseNumber,
  transporterCompanyMail: bsdasri.transporterCompanyMail,
  transporterCustomInfo: bsdasri.transporterCustomInfo,
  transporterTakenOverAt: bsdasri.transporterTakenOverAt
});

type RegistryFields =
  | "isIncomingWasteFor"
  | "isOutgoingWasteFor"
  | "isTransportedWasteFor"
  | "isManagedWasteFor";

export function getRegistryFields(
  bsdasri: Bsdasri
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: []
  };

  if (
    bsdasri.emitterEmissionSignatureDate &&
    bsdasri.transporterTransportSignatureDate
  ) {
    if (bsdasri.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsdasri.emitterCompanySiret);
    }
    const transporterCompanyOrgId = getTransporterCompanyOrgId(bsdasri);
    if (transporterCompanyOrgId) {
      registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
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

function toGenericWaste(bsdasri: Bsdasri): GenericWaste {
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
    status: bsdasri.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsdasri.destinationOperationDate,
    destinationReceptionWeight: bsdasri.destinationReceptionWasteWeightValue
      ? bsdasri.destinationReceptionWasteWeightValue / 1000
      : bsdasri.destinationReceptionWasteWeightValue,
    wasteAdr: bsdasri.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    ...getTransporterData(bsdasri)
  };
}

export function toIncomingWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
): Required<IncomingWaste> {
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

  if (bsdasri.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing 
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
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
    ...initialEmitter,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCustomInfo: bsdasri.destinationCustomInfo,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    ...getOperationData(bsdasri)
  };
}

export function toOutgoingWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
): Required<OutgoingWaste> {
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

  if (bsdasri.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing 
    ...emptyOutgoingWaste,
    ...genericWaste,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
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
    ...initialEmitter,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue / 1000
      : bsdasri.emitterWasteWeightValue,
    emitterCustomInfo: bsdasri.emitterCustomInfo,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    ...getOperationData(bsdasri)
  };
}

export function toTransportedWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
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

  if (bsdasri.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing 
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue / 1000
      : bsdasri.emitterWasteWeightValue,
    ...initialEmitter,
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
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    destinationCompanyMail: bsdasri.destinationCompanyMail
  };
}

/**
 * BSDASRI has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
): Required<ManagedWaste> {
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

  if (bsdasri.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing 
    ...emptyManagedWaste,
    ...genericWaste,
    managedStartDate: null,
    managedEndDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
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
    ...initialEmitter,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    destinationCompanyMail: bsdasri.destinationCompanyMail
  };
}

export function toAllWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
): Required<AllWaste> {
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

  if (bsdasri.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing 
    ...emptyAllWaste,
    ...genericWaste,
    createdAt: bsdasri.createdAt,
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
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
    ...initialEmitter,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue / 1000
      : bsdasri.emitterWasteWeightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    ...getOperationData(bsdasri)
  };
}
