import { Bsdasri } from ".prisma/client";
import { BsdElastic } from "../common/elastic";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import { extractPostalCode } from "../utils";
import { getWasteDescription } from "./utils";

export function getRegisterFields(
  bsdasri: Bsdasri
): Pick<
  BsdElastic,
  | "isIncomingWasteFor"
  | "isOutgoingWasteFor"
  | "isTransportedWasteFor"
  | "isManagedWasteFor"
> {
  const registerFields = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: []
  };

  if (bsdasri.transporterTakenOverAt) {
    registerFields.isOutgoingWasteFor.push(bsdasri.emitterCompanySiret);
    registerFields.isTransportedWasteFor.push(bsdasri.transporterCompanySiret);
  }

  if (bsdasri.destinationReceptionDate) {
    registerFields.isIncomingWasteFor.push(bsdasri.destinationCompanySiret);
  }

  return registerFields;
}

export function toIncomingWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
): IncomingWaste {
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

  if (bsdasri.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    wasteDescription: getWasteDescription(bsdasri.wasteCode),
    wasteCode: bsdasri.wasteCode,
    pop: false,
    id: bsdasri.id,
    destinationReceptionWeight: bsdasri.destinationReceptionWasteWeightValue
      ? bsdasri.destinationReceptionWasteWeightValue / 1000
      : bsdasri.destinationReceptionWasteWeightValue,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    ecoOrganismeSiren: bsdasri.ecoOrganismeSiret?.slice(0, 9),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    transporterCompanyName: bsdasri.transporterCompanyName,
    transporterCompanySiret: bsdasri.transporterCompanySiret,
    transporterRecepisseNumber: bsdasri.transporterRecepisseNumber,
    destinationOperationCode: bsdasri.destinationOperationCode,
    bsdType: "BSDASRI",
    status: bsdasri.status,
    customId: null,
    destinationCustomInfo: bsdasri.destinationCustomInfo,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    transporterCompanyMail: bsdasri.transporterCompanyMail,
    transporterRecepisseIsExempted: false,
    wasteAdr: bsdasri.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}

export function toOutgoingWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
): OutgoingWaste {
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

  if (bsdasri.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    destinationPlannedOperationCode: bsdasri.destinationOperationCode,
    destinationPlannedOperationMode: null,
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    ecoOrganismeSiren: bsdasri.ecoOrganismeSiret?.slice(0, 9),
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterPickupsiteAddress: bsdasri.emitterPickupSiteAddress,
    ...initialEmitter,
    id: bsdasri.id,
    pop: false,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    transporterCompanyAddress: null,
    transporterCompanyName: bsdasri.transporterCompanyName,
    transporterCompanySiret: bsdasri.transporterCompanySiret,
    transporterTakenOverAt: bsdasri.transporterTakenOverAt,
    transporterRecepisseNumber: bsdasri.transporterRecepisseNumber,
    wasteCode: bsdasri.wasteCode,
    wasteDescription: getWasteDescription(bsdasri.wasteCode),
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue / 1000
      : bsdasri.emitterWasteWeightValue,
    bsdType: "BSDASRI",
    status: bsdasri.status,
    customId: null,
    emitterCustomInfo: bsdasri.emitterCustomInfo,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    transporterCompanyMail: bsdasri.transporterCompanyMail,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    transporterRecepisseIsExempted: null,
    wasteAdr: bsdasri.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}

export function toTransportedWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
): TransportedWaste {
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

  if (bsdasri.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    transporterTakenOverAt: bsdasri.transporterTakenOverAt,
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    wasteDescription: getWasteDescription(bsdasri.wasteCode),
    wasteCode: bsdasri.wasteCode,
    pop: false,
    id: bsdasri.id,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue / 1000
      : bsdasri.emitterWasteWeightValue,
    transporterNumberPlates: bsdasri.transporterTransportPlates,
    wasteAdr: bsdasri.wasteAdr,
    ...initialEmitter,
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterPickupsiteAddress: bsdasri.emitterPickupSiteAddress,
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    ecoOrganismeSiren: bsdasri.ecoOrganismeSiret?.slice(0, 9),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
    bsdType: "BSDASRI",
    status: bsdasri.status,
    customId: null,
    transporterCustomInfo: bsdasri.transporterCustomInfo,
    destinationCap: null,
    destinationOperationNoTraceability: null,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}

/**
 * BSDASRI has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
): ManagedWaste {
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

  if (bsdasri.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    destinationPlannedOperationCode: bsdasri.destinationOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsdasri.destinationReceptionWasteWeightValue
      ? bsdasri.destinationReceptionWasteWeightValue / 1000
      : bsdasri.destinationReceptionWasteWeightValue,
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    ecoOrganismeSiren: bsdasri.ecoOrganismeSiret?.slice(0, 9),
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterPickupsiteAddress: bsdasri.emitterPickupSiteAddress,
    ...initialEmitter,
    id: bsdasri.id,
    pop: false,
    transporterCompanyAddress: bsdasri.transporterCompanyAddress,
    transporterCompanyName: bsdasri.transporterCompanyName,
    transporterCompanySiret: bsdasri.transporterCompanySiret,
    transporterRecepisseNumber: bsdasri.transporterRecepisseNumber,
    wasteCode: bsdasri.wasteCode,
    wasteDescription: getWasteDescription(bsdasri.wasteCode),
    wasteAdr: bsdasri.wasteAdr,
    bsdType: "BSDASRI",
    status: bsdasri.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    transporterCompanyMail: bsdasri.transporterCompanyMail,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    transporterRecepisseIsExempted: null,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}

export function toAllWaste(
  bsdasri: Bsdasri & { grouping: Bsdasri[] }
): AllWaste {
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

  if (bsdasri.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdasri.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsdasri.destinationCompanyAddress,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    destinationOperationCode: bsdasri.destinationOperationCode,
    destinationPlannedOperationCode: bsdasri.destinationOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsdasri.destinationReceptionWasteWeightValue
      ? bsdasri.destinationReceptionWasteWeightValue / 1000
      : bsdasri.destinationReceptionWasteWeightValue,
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    ecoOrganismeSiren: bsdasri.ecoOrganismeSiret?.slice(0, 9),
    emitterCompanyAddress: bsdasri.emitterCompanyAddress,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterPickupsiteAddress: bsdasri.emitterPickupSiteAddress,
    ...initialEmitter,
    id: bsdasri.id,
    pop: false,
    transporterCompanyAddress: bsdasri.transporterCompanyAddress,
    transporterCompanyName: bsdasri.transporterCompanyName,
    transporterCompanySiret: bsdasri.transporterCompanySiret,
    transporterRecepisseNumber: bsdasri.transporterRecepisseNumber,
    wasteAdr: bsdasri.wasteAdr,
    wasteCode: bsdasri.wasteCode,
    wasteDescription: getWasteDescription(bsdasri.wasteCode),
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue / 1000
      : bsdasri.emitterWasteWeightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    bsdType: "BSDASRI",
    status: bsdasri.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    transporterCompanyMail: bsdasri.transporterCompanyMail,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    transporterRecepisseIsExempted: null,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}
