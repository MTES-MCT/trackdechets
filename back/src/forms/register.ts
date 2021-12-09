import { Form, TemporaryStorageDetail } from ".prisma/client";
import { BsdElastic } from "../common/elastic";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import { extractPostalCode } from "../utils";
import { formToBsdd } from "./compat";
import { Bsdd, FullForm } from "./types";

export function getRegisterFields(
  form: FullForm
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

  if (form.temporaryStorageDetailId) {
    const temporaryStorage = form.temporaryStorageDetail;
    if (temporaryStorage.tempStorerReceivedAt) {
      registerFields.isIncomingWasteFor.push(form.recipientCompanySiret);
    }
    if (temporaryStorage.signedAt) {
      registerFields.isOutgoingWasteFor.push(form.recipientCompanySiret);
      registerFields.isTransportedWasteFor.push(
        temporaryStorage.transporterCompanySiret
      );
    }
    if (form.receivedAt) {
      registerFields.isIncomingWasteFor.push(
        temporaryStorage.destinationCompanySiret
      );
    }
  } else {
    if (form.receivedAt) {
      registerFields.isIncomingWasteFor.push(form.recipientCompanySiret);
      registerFields.isTransportedWasteFor.push(form.transporterCompanySiret);
    }
  }
  if (form.sentAt) {
    registerFields.isOutgoingWasteFor.push(form.emitterCompanySiret);
    registerFields.isTransportedWasteFor.push(form.transporterCompanySiret);
    if (form.traderCompanySiret) {
      registerFields.isManagedWasteFor.push(form.traderCompanySiret);
    }
    if (form.brokerCompanySiret) {
      registerFields.isManagedWasteFor.push(form.brokerCompanySiret);
    }
  }

  return registerFields;
}

export function toIncomingWaste(
  bsdd: Bsdd & { forwarding: Bsdd } & { grouping: Bsdd[] }
): IncomingWaste {
  const initialEmitter = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsdd.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsdd.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsdd.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    destinationReceptionDate: bsdd.destinationReceptionDate,
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    pop: bsdd.pop,
    id: bsdd.id,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    ...initialEmitter,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    ecoOrganismeSiren: bsdd.ecoOrganismeSiret?.slice(0, 9),
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    destinationOperationCode: bsdd.destinationOperationCode,
    bsdType: "BSDD",
    customId: bsdd.customId,
    destinationCustomInfo: null,
    destinationCap: null,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    transporterCompanyMail: bsdd.transporterCompanyMail,
    transporterRecepisseIsExempted: false,
    wasteAdr: bsdd.wasteAdr
  };
}

export function toIncomingWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  },
  sirets: string[]
): IncomingWaste[] {
  const bsdd = formToBsdd(form);

  if (bsdd.forwarding) {
    // In case of temporary storage, a form can be flagged as incoming waste
    // either for the TTR or for the final destination. Here we compute two "virtual"
    // BSDDs, one from the emitter to the TTR and one from the TTR to the final destination
    const incomingWastes: IncomingWaste[] = [];

    if (sirets.includes(bsdd.destinationCompanySiret)) {
      // add a record only if TTR is present in the sirets
      incomingWastes.push(toIncomingWaste(bsdd));
    }
    if (sirets.includes(bsdd.forwarding.destinationCompanySiret)) {
      // add a record only if final destination is present in the sirets
      incomingWastes.push(
        toIncomingWaste({ ...bsdd.forwarding, forwarding: null })
      );
    }
    return incomingWastes;
  }

  return [toIncomingWaste(bsdd)];
}

export function toOutgoingWaste(
  bsdd: Bsdd & { forwarding: Bsdd } & { grouping: Bsdd[] }
): OutgoingWaste {
  const initialEmitter = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsdd.forwarding) {
    initialEmitter.initialEmitterCompanyAddress =
      bsdd.forwarding.emitterCompanyAddress;
    initialEmitter.initialEmitterCompanyName =
      bsdd.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsdd.forwarding.emitterCompanySiret;
  }

  if (bsdd.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    ecoOrganismeSiren: bsdd.ecoOrganismeSiret?.slice(0, 9),
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    ...initialEmitter,
    id: bsdd.id,
    pop: bsdd.pop,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    transporterCompanyAddress: bsdd.traderCompanyAddress,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    wasteCode: bsdd.wasteCode,
    wasteDescription: bsdd.wasteDescription,
    weight: bsdd.weightValue,
    bsdType: "BSDD",
    customId: bsdd.customId,
    emitterCustomInfo: null,
    destinationCap: bsdd.destinationCap,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    transporterCompanyMail: bsdd.transporterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    transporterRecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    wasteAdr: bsdd.wasteAdr
  };
}

export function toOutgoingWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  },
  sirets: string[]
): OutgoingWaste[] {
  const bsdd = formToBsdd(form);

  if (bsdd.forwarding) {
    // In case of temporary storage, a form can be flagged as outgoing waste
    // either for the emitter or for the TTR. Here we compute two "virtual"
    // BSDDs, one from the emitter to the TTR and one from the TTR to the final destination
    const outgoingWastes: OutgoingWaste[] = [];

    if (sirets.includes(bsdd.emitterCompanySiret)) {
      // add a record only if emitter is present in the sirets
      outgoingWastes.push(toOutgoingWaste(bsdd));
    }
    if (sirets.includes(bsdd.forwarding.emitterCompanySiret)) {
      // add a record only if TTR is present in the sirets
      outgoingWastes.push(
        toOutgoingWaste({ ...bsdd.forwarding, forwarding: null })
      );
    }
    return outgoingWastes;
  }

  return [toOutgoingWaste(bsdd)];
}

export function toTransportedWaste(
  bsdd: Bsdd & { forwarding: Bsdd } & { grouping: Bsdd[] }
): TransportedWaste {
  const initialEmitter = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsdd.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsdd.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsdd.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    pop: false,
    id: bsdd.id,
    weight: bsdd.weightValue,
    transporterNumberPlates: bsdd.transporterNumberPlates,
    wasteAdr: bsdd.wasteAdr,
    ...initialEmitter,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    ecoOrganismeSiren: bsdd.ecoOrganismeSiret?.slice(0, 9),
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    bsdType: "BSDD",
    customId: bsdd.customId,
    transporterCustomInfo: bsdd.transporterCustomInfo,
    destinationCap: bsdd.destinationCap,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail
  };
}

export function toTransportedWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  },
  sirets: string[]
): TransportedWaste[] {
  const bsdd = formToBsdd(form);

  if (bsdd.forwarding) {
    // In case of temporary storage, a form can be flagged as outgoing waste
    // either for the emitter or for the TTR. Here we compute two "virtual"
    // BSDDs, one from the emitter to the TTR and one from the TTR to the final destination
    const transportedWastes: TransportedWaste[] = [];

    if (sirets.includes(bsdd.transporterCompanySiret)) {
      // add a record only if initial transporter is present in the sirets
      transportedWastes.push(toTransportedWaste(bsdd));
    }
    if (sirets.includes(bsdd.forwarding.transporterCompanySiret)) {
      // add a record only if second transporter is present in the sirets
      transportedWastes.push(
        toTransportedWaste({ ...bsdd.forwarding, forwarding: null })
      );
    }
    return transportedWastes;
  }

  return [toTransportedWaste(bsdd)];
}

export function toManagedWaste(
  bsdd: Bsdd & { forwarding: Bsdd } & { grouping: Bsdd[] }
): ManagedWaste {
  const initialEmitter = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsdd.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsdd.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsdd.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    ecoOrganismeSiren: bsdd.ecoOrganismeSiret?.slice(0, 9),
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    ...initialEmitter,
    id: bsdd.id,
    pop: bsdd.pop,
    transporterCompanyAddress: bsdd.transporterCompanyAddress,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    wasteCode: bsdd.wasteCode,
    wasteDescription: bsdd.wasteDescription,
    bsdType: "BSDD",
    customId: bsdd.customId,
    destinationCap: bsdd.destinationCap,
    destinationOperationNoTraceability: null,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    transporterCompanyMail: bsdd.transporterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    transporterRecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    wasteAdr: bsdd.wasteAdr
  };
}

export function toManagedWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  }
): ManagedWaste[] {
  const bsdd = formToBsdd(form);
  if (bsdd.forwarding) {
    // TODO check reglementation
    // in case of temporary storage, we assume that the trader or
    // broker has only dealt the waste from the emitter to the TTR
    return [toManagedWaste({ ...bsdd.forwarding, forwarding: null })];
  }
  return [toManagedWaste(bsdd)];
}

export function toAllWaste(
  bsdd: Bsdd & { forwarding: Bsdd } & { grouping: Bsdd[] }
): AllWaste {
  const initialEmitter = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterPostalCodes: null
  };

  if (bsdd.forwarding) {
    // ce n'est pas 100% en accord avec le registre puisque le texte demande de faire apparaitre
    // ici le N°SIRET et la raison sociale de l'émetteur initial. Cependant, pour protéger le
    //secret des affaires, et en attendant une clarification officielle, on se limite ici au code postal.
    initialEmitter.initialEmitterPostalCodes = [
      extractPostalCode(bsdd.forwarding.emitterCompanyAddress)
    ].filter(s => !!s);
  }

  if (bsdd.grouping) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  return {
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationOperationCode: bsdd.destinationOperationCode,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    ecoOrganismeSiren: bsdd.ecoOrganismeSiret?.slice(0, 9),
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    ...initialEmitter,
    id: bsdd.id,
    pop: bsdd.pop,
    transporterCompanyAddress: bsdd.transporterCompanyAddress,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    wasteAdr: bsdd.wasteAdr,
    wasteCode: bsdd.wasteCode,
    wasteDescription: bsdd.wasteDescription,
    weight: bsdd.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    bsdType: "BSDD",
    customId: bsdd.customId,
    destinationCap: bsdd.destinationCap,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    transporterCompanyMail: bsdd.transporterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    transporterRecepisseIsExempted: bsdd.transporterRecepisseIsExempted
  };
}

export function toAllWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  },
  sirets: string[]
): AllWaste[] {
  const bsdd = formToBsdd(form);

  if (bsdd.forwarding) {
    // In case of temporary storage, a form can appear in all waste register
    // either for initial form or for reexpedition. Here we compute two "virtual"
    // BSDDs, one from the emitter to the TTR and one from the TTR to the final destination
    const allWastes: AllWaste[] = [];

    if (
      sirets.some(siret =>
        [
          bsdd.emitterCompanySiret,
          bsdd.transporterCompanySiret,
          bsdd.traderCompanySiret,
          bsdd.brokerCompanySiret,
          bsdd.destinationCompanySiret
        ].includes(siret)
      )
    ) {
      // add a record only if siret is present in initial form
      allWastes.push(toAllWaste(bsdd));
    }
    if (
      sirets.some(siret =>
        [
          bsdd.forwarding.emitterCompanySiret,
          bsdd.forwarding.transporterCompanySiret,
          bsdd.forwarding.traderCompanySiret,
          bsdd.forwarding.brokerCompanySiret,
          bsdd.forwarding.destinationCompanySiret
        ].includes(siret)
      )
    ) {
      // add a record only if siret is present in reexpedition
      allWastes.push(toAllWaste({ ...bsdd.forwarding, forwarding: null }));
    }
    return allWastes;
  }

  return [toAllWaste(bsdd)];
}
