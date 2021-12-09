import { Bsff } from ".prisma/client";
import { BsdElastic } from "../common/elastic";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import { extractPostalCode } from "../utils";

export function getRegisterFields(
  bsff: Bsff
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

  if (bsff.transporterTransportTakenOverAt) {
    registerFields.isOutgoingWasteFor.push(bsff.emitterCompanySiret);
    registerFields.isTransportedWasteFor.push(bsff.transporterCompanySiret);
  }

  if (bsff.destinationReceptionDate) {
    registerFields.isIncomingWasteFor.push(bsff.destinationCompanySiret);
  }

  return registerFields;
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

  if (bsff.repackaging) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    destinationReceptionDate: bsff.destinationReceptionDate,
    wasteDescription: bsff.wasteDescription,
    wasteCode: bsff.wasteCode,
    pop: false,
    id: bsff.id,
    destinationReceptionWeight: bsff.destinationReceptionWeight
      ? bsff.destinationReceptionWeight / 1000
      : bsff.destinationReceptionWeight,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
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
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterRecepisseNumber: bsff.transporterRecepisseNumber,
    destinationOperationCode: bsff.destinationOperationCode,
    bsdType: "BSFF",
    customId: null,
    destinationCustomInfo: bsff.destinationCustomInfo,
    destinationCap: bsff.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsff.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsff.emitterCompanyMail,
    transporterCompanyMail: bsff.transporterCompanyMail,
    transporterRecepisseIsExempted: false,
    wasteAdr: bsff.wasteAdr
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

  if (bsff.repackaging) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    id: bsff.id,
    pop: false,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    transporterCompanyAddress: null,
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterTakenOverAt: bsff.transporterTransportSignatureDate,
    transporterRecepisseNumber: bsff.transporterRecepisseNumber,
    wasteCode: bsff.wasteCode,
    wasteDescription: bsff.wasteDescription,
    weight: bsff.weightValue ? bsff.weightValue / 1000 : bsff.weightValue,
    bsdType: "BSFF",
    customId: null,
    emitterCustomInfo: bsff.emitterCustomInfo,
    destinationCap: bsff.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsff.destinationReceptionAcceptationStatus,
    transporterCompanyMail: bsff.transporterCompanyMail,
    destinationCompanyMail: bsff.destinationCompanyMail,
    transporterRecepisseIsExempted: null,
    wasteAdr: bsff.wasteAdr
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

  if (bsff.repackaging) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    transporterTakenOverAt: bsff.transporterTransportSignatureDate,
    destinationReceptionDate: bsff.destinationReceptionDate,
    wasteDescription: bsff.wasteDescription,
    wasteCode: bsff.wasteCode,
    pop: false,
    id: bsff.id,
    weight: bsff.weightValue ? bsff.weightValue / 1000 : bsff.weightValue,
    transporterNumberPlates: null,
    wasteAdr: bsff.wasteAdr,
    ...initialEmitter,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    bsdType: "BSFF",
    customId: null,
    transporterCustomInfo: bsff.transporterCustomInfo,
    destinationCap: bsff.destinationCap,
    destinationOperationNoTraceability: null,
    destinationReceptionAcceptationStatus:
      bsff.destinationReceptionAcceptationStatus,
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

  if (bsff.repackaging) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsff.destinationReceptionWeight
      ? bsff.destinationReceptionWeight / 1000
      : bsff.destinationReceptionWeight,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    id: bsff.id,
    pop: false,
    transporterCompanyAddress: bsff.transporterCompanyAddress,
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterRecepisseNumber: bsff.transporterRecepisseNumber,
    wasteCode: bsff.wasteCode,
    wasteDescription: bsff.wasteDescription,
    bsdType: "BSFF",
    customId: null,
    destinationCap: bsff.destinationCap,
    destinationOperationNoTraceability: null,
    destinationReceptionAcceptationStatus:
      bsff.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsff.emitterCompanyMail,
    transporterCompanyMail: bsff.transporterCompanyMail,
    destinationCompanyMail: bsff.destinationCompanyMail,
    transporterRecepisseIsExempted: null,
    wasteAdr: bsff.wasteAdr
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

  if (bsff.repackaging) {
    initialEmitter.initialEmitterPostalCodes = bsff.repackaging
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  if (bsff.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsff.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
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
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    ...initialEmitter,
    id: bsff.id,
    pop: false,
    transporterCompanyAddress: bsff.transporterCompanyAddress,
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterRecepisseNumber: bsff.transporterRecepisseNumber,
    wasteAdr: bsff.wasteAdr,
    wasteCode: bsff.wasteCode,
    wasteDescription: bsff.wasteDescription,
    weight: bsff.weightValue ? bsff.weightValue / 1000 : bsff.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    bsdType: "BSFF",
    customId: null,
    destinationCap: bsff.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsff.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsff.emitterCompanyMail,
    transporterCompanyMail: bsff.transporterCompanyMail,
    destinationCompanyMail: bsff.destinationCompanyMail,
    transporterRecepisseIsExempted: null
  };
}
