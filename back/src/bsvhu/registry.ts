import { Bsvhu } from ".prisma/client";
import { BsdElastic } from "../common/elastic";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import { GenericWaste } from "../registry/types";
import { getWasteDescription } from "./utils";

export function getRegistryFields(
  bsvhu: Bsvhu
): Pick<
  BsdElastic,
  | "isIncomingWasteFor"
  | "isOutgoingWasteFor"
  | "isTransportedWasteFor"
  | "isManagedWasteFor"
> {
  const registryFields = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: []
  };

  if (
    bsvhu.emitterEmissionSignatureDate &&
    bsvhu.transporterTransportSignatureDate
  ) {
    registryFields.isOutgoingWasteFor.push(bsvhu.emitterCompanySiret);
    registryFields.isTransportedWasteFor.push(bsvhu.transporterCompanySiret);
  }

  if (bsvhu.destinationOperationSignatureDate) {
    registryFields.isIncomingWasteFor.push(bsvhu.destinationCompanySiret);
  }

  return registryFields;
}

function toGenericWaste(bsvhu: Bsvhu): GenericWaste {
  return {
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    pop: false,
    id: bsvhu.id,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    bsdType: "BSVHU",
    status: bsvhu.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsvhu.destinationOperationDate,
    transporterRecepisseIsExempted: false,
    wasteAdr: null,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
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

  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    ...genericWaste,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? bsvhu.destinationReceptionWeight / 1000
      : bsvhu.destinationReceptionWeight,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
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
    destinationCustomInfo: bsvhu.destinationCustomInfo,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    transporterCompanyMail: bsvhu.transporterCompanyMail
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

  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    ...genericWaste,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    transporterCompanyAddress: null,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    emitterCustomInfo: bsvhu.emitterCustomInfo,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    destinationCompanyMail: bsvhu.destinationCompanyMail
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
  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    ...genericWaste,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterCompanyAddress: bsvhu.transporterCompanyAddress,
    transporterNumberPlates: bsvhu.transporterTransportPlates,
    ...initialEmitter,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    transporterCustomInfo: bsvhu.transporterCustomInfo,
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

  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    ...genericWaste,
    managedStartDate: null,
    managedEndDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? bsvhu.destinationReceptionWeight / 1000
      : bsvhu.destinationReceptionWeight,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    transporterCompanyAddress: bsvhu.transporterCompanyAddress,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    destinationCompanyMail: bsvhu.destinationCompanyMail
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

  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    ...genericWaste,
    createdAt: bsvhu.createdAt,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
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
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    transporterCompanyAddress: bsvhu.transporterCompanyAddress,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    destinationCompanyMail: bsvhu.destinationCompanyMail
  };
}
