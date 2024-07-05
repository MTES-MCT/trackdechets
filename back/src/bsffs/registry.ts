import { BsffTransporter, BsffType, OperationMode } from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import { BsdElastic } from "../common/elastic";
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
import { toBsffDestination } from "./compat";
import { RegistryBsff } from "../registry/elastic";
import { getFirstTransporterSync } from "./database";
import { BsffWithTransporters } from "./types";

const getOperationData = (bsff: RegistryBsff) => {
  const bsffDestination = toBsffDestination(bsff.packagings);

  return {
    destinationOperationCode: bsffDestination.operationCode,
    destinationOperationMode: bsffDestination.operationMode as OperationMode,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode
  };
};

const getFinalOperationsData = (bsff: RegistryBsff) => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  // Check if finalOperations is defined and has elements
  for (const packaging of bsff.packagings) {
    if (packaging.finalOperations && packaging.finalOperations.length > 0) {
      // Iterate through each operation once and fill both arrays
      packaging.finalOperations.forEach(ope => {
        destinationFinalOperationCodes.push(ope.operationCode);
        destinationFinalOperationWeights.push(ope.quantity.toNumber());
      });
    }
  }

  return { destinationFinalOperationCodes, destinationFinalOperationWeights };
};

const getTransporterData = (
  transporter: BsffTransporter,
  includePlates = false
) => {
  const data = {
    transporterRecepisseIsExempted: transporter.transporterRecepisseIsExempted,
    transporterTakenOverAt: transporter.transporterTransportTakenOverAt,
    transporterCompanyAddress: transporter.transporterCompanyAddress,
    transporterCompanyName: transporter.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    transporterRecepisseNumber: transporter.transporterRecepisseNumber,
    transporterCompanyMail: transporter.transporterCompanyMail,
    transporterCustomInfo: transporter.transporterCustomInfo,
    transporterTransportMode: transporter.transporterTransportMode
  };

  if (includePlates) {
    return {
      ...data,
      transporterNumberPlates: transporter.transporterTransportPlates ?? null
    };
  }

  return data;
};

export function getRegistryFields(
  bsff: BsffWithTransporters
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: [],
    isAllWasteFor: []
  };

  const transporter = getFirstTransporterSync(bsff);

  if (
    bsff.emitterEmissionSignatureDate &&
    transporter?.transporterTransportSignatureDate
  ) {
    if (bsff.destinationCompanySiret) {
      registryFields.isAllWasteFor.push(bsff.destinationCompanySiret);
    }
    if (bsff.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsff.emitterCompanySiret);
      registryFields.isAllWasteFor.push(bsff.emitterCompanySiret);
    }
    registryFields.isOutgoingWasteFor.push(...bsff.detenteurCompanySirets);
    registryFields.isAllWasteFor.push(...bsff.detenteurCompanySirets);

    const transporterOrgId = getTransporterCompanyOrgId(transporter);
    if (transporterOrgId) {
      registryFields.isTransportedWasteFor.push(transporterOrgId);
      registryFields.isAllWasteFor.push(transporterOrgId);
    }
  }

  if (bsff.destinationReceptionSignatureDate && bsff.destinationCompanySiret) {
    registryFields.isIncomingWasteFor.push(bsff.destinationCompanySiret);
  }

  return registryFields;
}

export const getSubType = (bsff: RegistryBsff): BsdSubType => {
  if (bsff.type === "GROUPEMENT") {
    return "GROUPEMENT";
  } else if (bsff.type === "RECONDITIONNEMENT") {
    return "RECONDITIONNEMENT";
  } else if (bsff.type === "REEXPEDITION") {
    return "RESHIPMENT";
  }

  return "INITIAL";
};

export function toGenericWaste(bsff: RegistryBsff): GenericWaste {
  const bsffDestination = toBsffDestination(bsff.packagings);

  return {
    wasteDescription: bsff.wasteDescription,
    wasteCode: bsff.wasteCode,
    wasteIsDangerous: true,
    pop: false,
    id: bsff.id,
    createdAt: bsff.createdAt,
    updatedAt: bsff.updatedAt,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    bsdType: "BSFF",
    bsdSubType: getSubType(bsff),
    status: bsff.status,
    customId: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsffDestination.receptionAcceptationStatus,
    destinationOperationDate: bsffDestination.operationDate,
    destinationReceptionWeight: bsffDestination.receptionWeight
      ? bsffDestination.receptionWeight / 1000
      : bsffDestination.receptionWeight,
    wasteAdr: bsff.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    destinationCompanyMail: bsff.destinationCompanyMail
  };
}

export function toIncomingWaste(bsff: RegistryBsff): Required<IncomingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsff);
  const transporter = getFirstTransporterSync(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationReceptionDate: bsff.destinationReceptionDate,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...getOperationData(bsff),
    ...(transporter ? getTransporterData(transporter) : {})
  };
}

export function toOutgoingWaste(bsff: RegistryBsff): Required<OutgoingWaste> {
  const transporter = getFirstTransporterSync(bsff);

  const initialEmitter: Pick<
    OutgoingWaste,
    | "initialEmitterCompanyAddress"
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
  > = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  if (bsff.type === BsffType.REEXPEDITION) {
    const initialBsff = bsff.packagings[0]?.previousPackagings[0]?.bsff;
    if (initialBsff) {
      // Legagcy reexpedition BSFFs may have been created without linking to previous packagings
      initialEmitter.initialEmitterCompanyAddress =
        initialBsff.emitterCompanyAddress;
      initialEmitter.initialEmitterCompanyName = initialBsff.emitterCompanyName;
      initialEmitter.initialEmitterCompanySiret =
        initialBsff.emitterCompanySiret;
    }
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyOutgoingWaste,
    ...genericWaste,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toNumber()
      : null,
    ...getOperationData(bsff),
    ...getFinalOperationsData(bsff),
    ...(transporter ? getTransporterData(transporter) : {})
  };
}

export function toTransportedWaste(
  bsff: RegistryBsff
): Required<TransportedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsff);
  const transporter = getFirstTransporterSync(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsff.destinationReceptionDate,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toNumber()
      : null,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...(transporter ? getTransporterData(transporter, true) : {})
  };
}

/**
 * BSFF has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(bsff: RegistryBsff): Required<ManagedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsff);
  const transporter = getFirstTransporterSync(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
    ...genericWaste,
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...(transporter ? getTransporterData(transporter) : {})
  };
}

export function toAllWaste(bsff: RegistryBsff): Required<AllWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsff);
  const transporter = getFirstTransporterSync(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyAllWaste,
    ...genericWaste,
    createdAt: bsff.createdAt,
    destinationReceptionDate: bsff.destinationReceptionDate,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toNumber()
      : null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...getOperationData(bsff),
    ...getFinalOperationsData(bsff),
    ...(transporter ? getTransporterData(transporter, true) : {})
  };
}
