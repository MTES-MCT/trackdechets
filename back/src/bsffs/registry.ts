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
import { extractPostalCode } from "../utils";
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

const getTransporterData = (transporter: BsffTransporter) => ({
  transporterRecepisseIsExempted: transporter.transporterRecepisseIsExempted,
  transporterTakenOverAt: transporter.transporterTransportTakenOverAt,
  transporterCompanyAddress: transporter.transporterCompanyAddress,
  transporterCompanyName: transporter.transporterCompanyName,
  transporterCompanySiret: transporter.transporterCompanySiret,
  transporterRecepisseNumber: transporter.transporterRecepisseNumber,
  transporterCompanyMail: transporter.transporterCompanyMail,
  transporterCustomInfo: transporter.transporterCustomInfo,
  transporterNumberPlates: transporter.transporterTransportPlates
});

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
    return "GATHERING";
  } else if (bsff.type === "RECONDITIONNEMENT") {
    return "RECONDITIONNEMENT";
  } else if (bsff.type === "REEXPEDITION") {
    return "RESHIPMENT";
  }

  return "INITIAL";
};

function toGenericWaste(bsff: RegistryBsff): GenericWaste {
  const bsffDestination = toBsffDestination(bsff.packagings);
  const transporter = getFirstTransporterSync(bsff);

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
    ...(transporter ? getTransporterData(transporter) : {}),
    destinationCompanyMail: bsff.destinationCompanyMail
  };
}

export function toIncomingWaste(bsff: RegistryBsff): Required<IncomingWaste> {
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

  if (
    [
      BsffType.REEXPEDITION,
      BsffType.GROUPEMENT,
      BsffType.RECONDITIONNEMENT
    ].includes(bsff.type as any)
  ) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial en cas de réexpédition. Cependant,
    // pour protéger le secret des affaires, et en attendant une clarification officielle, on se
    // limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = bsff.packagings
      .flatMap(p => p.previousPackagings)
      .map(p => extractPostalCode(p.bsff.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

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
    ...initialEmitter,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCustomInfo: bsff.destinationCustomInfo,
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...getOperationData(bsff)
  };
}

export function toOutgoingWaste(bsff: RegistryBsff): Required<OutgoingWaste> {
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

  if (
    [BsffType.GROUPEMENT, BsffType.RECONDITIONNEMENT].includes(bsff.type as any)
  ) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = bsff.packagings
      .flatMap(p => p.previousPackagings)
      .map(p => extractPostalCode(p.bsff.emitterCompanyAddress))
      .filter(s => !!s);
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
    emitterCustomInfo: bsff.emitterCustomInfo,
    ...getOperationData(bsff),
    ...getFinalOperationsData(bsff)
  };
}

export function toTransportedWaste(
  bsff: RegistryBsff
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

  if (
    [
      BsffType.REEXPEDITION,
      BsffType.GROUPEMENT,
      BsffType.RECONDITIONNEMENT
    ].includes(bsff.type as any)
  ) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial en cas de réexpédition. Cependant,
    // pour protéger le secret des affaires, et en attendant une clarification officielle, on se
    // limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = bsff.packagings
      .flatMap(p => p.previousPackagings)
      .map(p => extractPostalCode(p.bsff.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsff.destinationReceptionDate,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toNumber()
      : null,
    ...initialEmitter,
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
    emitterCompanyMail: bsff.emitterCompanyMail
  };
}

/**
 * BSFF has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(bsff: RegistryBsff): Required<ManagedWaste> {
  const initialEmitter: Pick<
    ManagedWaste,
    | "initialEmitterCompanyAddress"
    | "initialEmitterCompanyName"
    | "initialEmitterCompanySiret"
    | "initialEmitterPostalCodes"
  > = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  if (bsff.type === BsffType.REEXPEDITION) {
    const initialBsff = bsff.packagings[0]?.previousPackagings[0]?.bsff;
    initialEmitter.initialEmitterCompanyAddress =
      initialBsff.emitterCompanyAddress;
    initialEmitter.initialEmitterCompanyName = initialBsff.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret = initialBsff.emitterCompanySiret;
  }

  if (
    [BsffType.GROUPEMENT, BsffType.RECONDITIONNEMENT].includes(bsff.type as any)
  ) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = bsff.packagings
      .flatMap(p => p.previousPackagings)
      .map(p => extractPostalCode(p.bsff.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

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
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    emitterCompanyMail: bsff.emitterCompanyMail
  };
}

export function toAllWaste(bsff: RegistryBsff): Required<AllWaste> {
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

  if (
    [
      BsffType.REEXPEDITION,
      BsffType.GROUPEMENT,
      BsffType.RECONDITIONNEMENT
    ].includes(bsff.type as any)
  ) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial en cas de réexpédition. Cependant,
    // pour protéger le secret des affaires, et en attendant une clarification officielle, on se
    // limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = bsff.packagings
      .flatMap(p => p.previousPackagings)
      .map(p => extractPostalCode(p.bsff.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

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
    ...initialEmitter,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toNumber()
      : null,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...getOperationData(bsff),
    ...getFinalOperationsData(bsff)
  };
}
