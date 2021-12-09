import { Bsda } from ".prisma/client";
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
  bsda: Bsda
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

  if (bsda.transporterTransportTakenOverAt) {
    registerFields.isOutgoingWasteFor.push(bsda.emitterCompanySiret);
    if (bsda.workerCompanySiret) {
      registerFields.isOutgoingWasteFor.push(bsda.workerCompanySiret);
    }
    registerFields.isTransportedWasteFor.push(bsda.transporterCompanySiret);
    registerFields.isManagedWasteFor.push(bsda.brokerCompanySiret);
  }

  if (bsda.destinationReceptionDate) {
    registerFields.isIncomingWasteFor.push(bsda.destinationCompanySiret);
  }

  return registerFields;
}

export function toIncomingWaste(
  bsda: Bsda & { forwarding: Bsda; grouping: Bsda[] }
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

  if (bsda.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsda.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsda.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    destinationReceptionDate: bsda.destinationReceptionDate,
    wasteDescription: bsda.wasteName,
    wasteCode: bsda.wasteCode,
    pop: false,
    id: bsda.id,
    destinationReceptionWeight: bsda.destinationReceptionWeight
      ? bsda.destinationReceptionWeight / 1000
      : bsda.destinationReceptionWeight,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    ...initialEmitter,
    emitterPickupsiteAddress: null,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiren: bsda.ecoOrganismeSiret,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: null,
    transporterCompanyName: bsda.transporterCompanyName,
    transporterCompanySiret: bsda.transporterCompanySiret,
    transporterRecepisseNumber: bsda.transporterRecepisseNumber,
    destinationOperationCode: bsda.destinationOperationCode,
    bsdType: "BSDA",
    customId: null,
    destinationCustomInfo: bsda.destinationCustomInfo,
    destinationCap: bsda.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsda.emitterCompanyMail,
    transporterCompanyMail: bsda.transporterCompanyMail,
    transporterRecepisseIsExempted: bsda.transporterRecepisseIsExempted,
    wasteAdr: bsda.wasteAdr
  };
}

export function toOutgoingWaste(
  bsda: Bsda & { forwarding: Bsda; grouping: Bsda[] }
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

  if (bsda.forwarding) {
    initialEmitter.initialEmitterCompanyAddress =
      bsda.forwarding.emitterCompanyAddress;
    initialEmitter.initialEmitterCompanyName =
      bsda.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsda.forwarding.emitterCompanySiret;
  }

  if (bsda.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiren: bsda.ecoOrganismeSiret?.slice(0, 9),
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    ...initialEmitter,
    id: bsda.id,
    pop: false,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    transporterCompanyAddress: null,
    transporterCompanyName: bsda.transporterCompanyName,
    transporterCompanySiret: bsda.transporterCompanySiret,
    transporterTakenOverAt: bsda.transporterTransportTakenOverAt,
    transporterRecepisseNumber: bsda.transporterRecepisseNumber,
    wasteCode: bsda.wasteCode,
    wasteDescription: bsda.wasteName,
    weight: bsda.weightValue ? bsda.weightValue / 1000 : bsda.weightValue,
    bsdType: "BSDA",
    customId: null,
    emitterCustomInfo: bsda.emitterCustomInfo,
    destinationCap: bsda.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    transporterCompanyMail: bsda.transporterCompanyMail,
    destinationCompanyMail: bsda.destinationCompanyMail,
    transporterRecepisseIsExempted: bsda.transporterRecepisseIsExempted,
    wasteAdr: bsda.wasteAdr
  };
}

export function toTransportedWaste(
  bsda: Bsda & { forwarding: Bsda; grouping: Bsda[] }
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

  if (bsda.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsda.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsda.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    transporterTakenOverAt: bsda.transporterTransportTakenOverAt,
    destinationReceptionDate: bsda.destinationReceptionDate,
    wasteDescription: bsda.wasteName,
    wasteCode: bsda.wasteCode,
    pop: false,
    id: bsda.id,
    weight: bsda.weightValue ? bsda.weightValue / 1000 : bsda.weightValue,
    transporterNumberPlates: bsda.transporterTransportPlates,
    wasteAdr: bsda.wasteAdr,
    ...initialEmitter,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiren: bsda.ecoOrganismeSiret?.slice(0, 9),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    bsdType: "BSDA",
    customId: null,
    transporterCustomInfo: bsda.transporterCustomInfo,
    destinationCap: bsda.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsda.emitterCompanyMail,
    destinationCompanyMail: bsda.destinationCompanyMail
  };
}

export function toManagedWaste(
  bsda: Bsda & { forwarding: Bsda; grouping: Bsda[] }
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

  if (bsda.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsda.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsda.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsda.destinationReceptionWeight
      ? bsda.destinationReceptionWeight / 1000
      : bsda.destinationReceptionWeight,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiren: bsda.ecoOrganismeSiret?.slice(0, 9),
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    ...initialEmitter,
    id: bsda.id,
    pop: false,
    transporterCompanyAddress: bsda.transporterCompanyAddress,
    transporterCompanyName: bsda.transporterCompanyName,
    transporterCompanySiret: bsda.transporterCompanySiret,
    transporterRecepisseNumber: bsda.transporterRecepisseNumber,
    wasteCode: bsda.wasteCode,
    wasteDescription: bsda.wasteName,
    bsdType: "BSDA",
    customId: null,
    destinationCap: bsda.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsda.emitterCompanyMail,
    transporterCompanyMail: bsda.transporterCompanyMail,
    destinationCompanyMail: bsda.destinationCompanyMail,
    transporterRecepisseIsExempted: bsda.transporterRecepisseIsExempted,
    wasteAdr: bsda.wasteAdr
  };
}

export function toAllWaste(
  bsda: Bsda & { forwarding: Bsda; grouping: Bsda[] }
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

  if (bsda.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    // secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsda.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsda.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationOperationCode: bsda.destinationOperationCode,
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsda.destinationReceptionWeight
      ? bsda.destinationReceptionWeight / 1000
      : bsda.destinationReceptionWeight,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiren: bsda.ecoOrganismeSiret?.slice(0, 9),
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    ...initialEmitter,
    id: bsda.id,
    pop: false,
    transporterCompanyAddress: bsda.transporterCompanyAddress,
    transporterCompanyName: bsda.transporterCompanyName,
    transporterCompanySiret: bsda.transporterCompanySiret,
    transporterRecepisseNumber: bsda.transporterRecepisseNumber,
    wasteAdr: bsda.wasteAdr,
    wasteCode: bsda.wasteCode,
    wasteDescription: bsda.wasteName,
    weight: bsda.weightValue ? bsda.weightValue / 1000 : bsda.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    bsdType: "BSDA",
    customId: null,
    destinationCap: bsda.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsda.emitterCompanyMail,
    transporterCompanyMail: bsda.transporterCompanyMail,
    destinationCompanyMail: bsda.destinationCompanyMail,
    transporterRecepisseIsExempted: bsda.transporterRecepisseIsExempted
  };
}
