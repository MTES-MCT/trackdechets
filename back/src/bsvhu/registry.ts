import { Bsvhu } from "@prisma/client";
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

type RegistryFields =
  | "isIncomingWasteFor"
  | "isOutgoingWasteFor"
  | "isTransportedWasteFor"
  | "isManagedWasteFor";
export function getRegistryFields(
  bsvhu: Bsvhu
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: []
  };

  if (
    bsvhu.emitterEmissionSignatureDate &&
    bsvhu.transporterTransportSignatureDate
  ) {
    if (bsvhu.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsvhu.emitterCompanySiret);
    }
    if (bsvhu.transporterCompanySiret) {
      registryFields.isTransportedWasteFor.push(bsvhu.transporterCompanySiret);
    }
  }

  if (
    bsvhu.destinationOperationSignatureDate &&
    bsvhu.destinationCompanySiret
  ) {
    registryFields.isIncomingWasteFor.push(bsvhu.destinationCompanySiret);
  }

  return registryFields;
}

function toGenericWaste(bsvhu: Bsvhu): GenericWaste {
  return {
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    wasteIsDangerous: true,
    pop: false,
    id: bsvhu.id,
    createdAt: bsvhu.createdAt,
    updatedAt: bsvhu.createdAt,
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
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? bsvhu.destinationReceptionWeight / 1000
      : bsvhu.destinationReceptionWeight,
    transporterRecepisseIsExempted: false,
    transporterNumberPlates: bsvhu.transporterTransportPlates,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    transporterCustomInfo: bsvhu.transporterCustomInfo,
    transporterCompanyAddress: bsvhu.transporterCompanyAddress,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationOperationCode: bsvhu.destinationOperationCode,
    destinationOperationMode: bsvhu.destinationOperationMode,
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
    destinationCustomInfo: bsvhu.destinationCustomInfo,
    emitterCompanyMail: bsvhu.emitterCompanyMail
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
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    emitterCustomInfo: bsvhu.emitterCustomInfo,
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
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
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
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
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
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsvhu.destinationCompanyAddress,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsvhu.emitterCompanyAddress,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    destinationCompanyMail: bsvhu.destinationCompanyMail
  };
}
