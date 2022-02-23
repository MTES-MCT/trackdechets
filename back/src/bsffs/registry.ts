import { Bsff } from "@prisma/client";
import { BsdElastic } from "../common/elastic";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import { GenericWaste } from "../registry/types";
import { extractPostalCode } from "../utils";

export function getRegistryFields(
  bsff: Bsff
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
    bsff.emitterEmissionSignatureDate &&
    bsff.transporterTransportSignatureDate
  ) {
    registryFields.isOutgoingWasteFor.push(bsff.emitterCompanySiret);
    registryFields.isTransportedWasteFor.push(bsff.transporterCompanySiret);
  }

  if (bsff.destinationReceptionSignatureDate) {
    registryFields.isIncomingWasteFor.push(bsff.destinationCompanySiret);
  }

  return registryFields;
}

function toGenericWaste(bsff: Bsff): GenericWaste {
  return {
    wasteDescription: bsff.wasteDescription,
    wasteCode: bsff.wasteCode,
    pop: false,
    id: bsff.id,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    bsdType: "BSFF",
    status: bsff.status,
    customId: null,
    destinationCap: bsff.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsff.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsff.destinationOperationSignatureDate,
    transporterRecepisseIsExempted: false,
    wasteAdr: bsff.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}

export function toIncomingWaste(
  bsff: Bsff & { forwarding: Bsff; repackaging: Bsff[]; grouping: Bsff[] }
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

  if (bsff.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsff.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsff.repackaging?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

  return {
    ...genericWaste,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationReceptionDate: bsff.destinationReceptionDate,
    destinationReceptionWeight: bsff.destinationReceptionWeight
      ? bsff.destinationReceptionWeight / 1000
      : bsff.destinationReceptionWeight,
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
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterRecepisseNumber: bsff.transporterRecepisseNumber,
    destinationOperationCode: bsff.destinationOperationCode,
    destinationCustomInfo: bsff.destinationCustomInfo,
    emitterCompanyMail: bsff.emitterCompanyMail,
    transporterCompanyMail: bsff.transporterCompanyMail
  };
}

export function toOutgoingWaste(
  bsff: Bsff & { forwarding: Bsff; repackaging: Bsff[]; grouping: Bsff[] }
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

  if (bsff.forwarding) {
    initialEmitter.initialEmitterCompanyAddress =
      bsff.forwarding.emitterCompanyAddress;
    initialEmitter.initialEmitterCompanyName =
      bsff.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsff.forwarding.emitterCompanySiret;
  }

  if (bsff.repackaging?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }
  const { __typename, ...genericWaste } = toGenericWaste(bsff);

  return {
    ...genericWaste,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    transporterCompanyAddress: null,
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterTakenOverAt: bsff.transporterTransportSignatureDate,
    transporterRecepisseNumber: bsff.transporterRecepisseNumber,
    weight: bsff.weightValue ? bsff.weightValue / 1000 : bsff.weightValue,
    emitterCustomInfo: bsff.emitterCustomInfo,
    transporterCompanyMail: bsff.transporterCompanyMail,
    destinationCompanyMail: bsff.destinationCompanyMail
  };
}

export function toTransportedWaste(
  bsff: Bsff & { forwarding: Bsff; repackaging: Bsff[]; grouping: Bsff[] }
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

  if (bsff.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsff.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsff.repackaging?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

  return {
    ...genericWaste,
    transporterTakenOverAt: bsff.transporterTransportSignatureDate,
    destinationReceptionDate: bsff.destinationReceptionDate,
    weight: bsff.weightValue ? bsff.weightValue / 1000 : bsff.weightValue,
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterCompanyAddress: bsff.transporterCompanyAddress,
    transporterNumberPlates: null,
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
    transporterCustomInfo: bsff.transporterCustomInfo,
    emitterCompanyMail: bsff.emitterCompanyMail,
    destinationCompanyMail: bsff.destinationCompanyMail
  };
}

/**
 * BSFF has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(
  bsff: Bsff & { forwarding: Bsff; repackaging: Bsff[]; grouping: Bsff[] }
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
    initialEmitterCompanySiret: null
  };

  if (bsff.forwarding) {
    initialEmitter.initialEmitterCompanyAddress =
      bsff.forwarding.emitterCompanyAddress;
    initialEmitter.initialEmitterCompanyName =
      bsff.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsff.forwarding.emitterCompanySiret;
  }

  if (bsff.repackaging?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

  return {
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
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsff.destinationReceptionWeight
      ? bsff.destinationReceptionWeight / 1000
      : bsff.destinationReceptionWeight,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    transporterCompanyAddress: bsff.transporterCompanyAddress,
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterRecepisseNumber: bsff.transporterRecepisseNumber,
    emitterCompanyMail: bsff.emitterCompanyMail,
    transporterCompanyMail: bsff.transporterCompanyMail,
    destinationCompanyMail: bsff.destinationCompanyMail
  };
}

export function toAllWaste(
  bsff: Bsff & { forwarding: Bsff; repackaging: Bsff[]; grouping: Bsff[] }
): AllWaste {
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

  if (bsff.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsff.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsff.repackaging?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

  return {
    ...genericWaste,
    createdAt: bsff.createdAt,
    transporterTakenOverAt: bsff.transporterTransportTakenOverAt,
    destinationReceptionDate: bsff.destinationReceptionDate,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationOperationCode: bsff.destinationOperationCode,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsff.destinationReceptionWeight
      ? bsff.destinationReceptionWeight / 1000
      : bsff.destinationReceptionWeight,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    transporterCompanyAddress: bsff.transporterCompanyAddress,
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterRecepisseNumber: bsff.transporterRecepisseNumber,
    weight: bsff.weightValue ? bsff.weightValue / 1000 : bsff.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsff.emitterCompanyMail,
    transporterCompanyMail: bsff.transporterCompanyMail,
    destinationCompanyMail: bsff.destinationCompanyMail
  };
}
