import { Bsvhu } from ".prisma/client";
import { getWasteDescription } from "../bsdasris/utills";
import { BsdElastic } from "../common/elastic";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";

export function getRegisterFields(
  bsvhu: Bsvhu
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

  if (bsvhu.transporterTransportTakenOverAt) {
    registerFields.isOutgoingWasteFor.push(bsvhu.emitterCompanySiret);
    registerFields.isTransportedWasteFor.push(bsvhu.transporterCompanySiret);
  }

  if (bsvhu.destinationReceptionDate) {
    registerFields.isIncomingWasteFor.push(bsvhu.destinationCompanySiret);
  }

  return registerFields;
}

export function toIncomingWaste(bsvhu: Bsvhu): IncomingWaste {
  const initialEmitter: Pick<
    IncomingWaste,
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterCompanyAddress"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterPostalCodes: null
  };

  return {
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    pop: false,
    id: bsvhu.id,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? bsvhu.destinationReceptionWeight / 1000
      : bsvhu.destinationReceptionWeight,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    destinationOperationCode: bsvhu.destinationOperationCode,
    bsdType: "BSVHU",
    status: bsvhu.status,
    customId: null,
    destinationCustomInfo: bsvhu.destinationCustomInfo,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    transporterRecepisseIsExempted: false,
    wasteAdr: null,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}

export function toOutgoingWaste(bsvhu: Bsvhu): OutgoingWaste {
  const initialEmitter: Pick<
    OutgoingWaste,
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterCompanyAddress"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterPostalCodes: null
  };
  return {
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    id: bsvhu.id,
    pop: false,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    transporterCompanyAddress: null,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    wasteCode: bsvhu.wasteCode,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    bsdType: "BSVHU",
    status: bsvhu.status,
    customId: null,
    emitterCustomInfo: bsvhu.emitterCustomInfo,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    transporterRecepisseIsExempted: null,
    wasteAdr: null,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}

export function toTransportedWaste(bsvhu: Bsvhu): TransportedWaste {
  const initialEmitter: Pick<
    TransportedWaste,
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterCompanyAddress"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterPostalCodes: null
  };
  return {
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    pop: false,
    id: bsvhu.id,
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    transporterNumberPlates: bsvhu.transporterTransportPlates,
    wasteAdr: null,
    ...initialEmitter,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    bsdType: "BSVHU",
    status: bsvhu.status,
    customId: null,
    transporterCustomInfo: bsvhu.transporterCustomInfo,
    destinationCap: null,
    destinationOperationNoTraceability: null,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    destinationCompanyMail: bsvhu.destinationCompanyMail
  };
}

/**
 * BSVHU has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(bsvhu: Bsvhu): ManagedWaste {
  const initialEmitter: Pick<
    ManagedWaste,
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterCompanyAddress"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterPostalCodes: null
  };

  return {
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? bsvhu.destinationReceptionWeight / 1000
      : bsvhu.destinationReceptionWeight,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    id: bsvhu.id,
    pop: false,
    transporterCompanyAddress: bsvhu.transporterCompanyAddress,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    wasteCode: bsvhu.wasteCode,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    bsdType: "BSVHU",
    status: bsvhu.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: null,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    transporterRecepisseIsExempted: null,
    wasteAdr: null,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}

export function toAllWaste(bsvhu: Bsvhu): AllWaste {
  const initialEmitter: Pick<
    AllWaste,
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterCompanyAddress"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterPostalCodes: null
  };

  return {
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationOperationCode: bsvhu.destinationOperationCode,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? bsvhu.destinationReceptionWeight / 1000
      : bsvhu.destinationReceptionWeight,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    id: bsvhu.id,
    pop: false,
    transporterCompanyAddress: bsvhu.transporterCompanyAddress,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    wasteAdr: null,
    wasteCode: bsvhu.wasteCode,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    bsdType: "BSVHU",
    status: bsvhu.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    transporterRecepisseIsExempted: null,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}
