import { Form, TemporaryStorageDetail, TransportSegment } from "@prisma/client";
import { BsdElastic } from "../common/elastic";
import { buildAddress } from "../companies/sirene/utils";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "@trackdechets/codegen/src/back.gen";
import { GenericWaste } from "../registry/types";
import { extractPostalCode } from "../utils";
import { formToBsdd } from "./compat";
import { Bsdd, FullForm } from "./types";

export function getRegistryFields(
  form: FullForm
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

  if (form.temporaryStorageDetailId) {
    const temporaryStorage = form.temporaryStorageDetail;
    if (temporaryStorage.tempStorerReceivedAt) {
      registryFields.isIncomingWasteFor.push(form.recipientCompanySiret);
    }
    if (temporaryStorage.signedAt) {
      registryFields.isOutgoingWasteFor.push(form.recipientCompanySiret);
      registryFields.isTransportedWasteFor.push(
        temporaryStorage.transporterCompanySiret
      );

      if (form.transportSegments?.length) {
        for (const transportSegment of form.transportSegments) {
          registryFields.isTransportedWasteFor.push(
            transportSegment.transporterCompanySiret
          );
        }
      }
    }
    if (form.receivedAt) {
      registryFields.isIncomingWasteFor.push(
        temporaryStorage.destinationCompanySiret
      );
    }
  } else {
    if (form.receivedAt) {
      registryFields.isIncomingWasteFor.push(form.recipientCompanySiret);
      registryFields.isTransportedWasteFor.push(form.transporterCompanySiret);

      if (form.transportSegments?.length) {
        for (const transportSegment of form.transportSegments) {
          registryFields.isTransportedWasteFor.push(
            transportSegment.transporterCompanySiret
          );
        }
      }
    }
  }
  if (form.sentAt) {
    registryFields.isOutgoingWasteFor.push(form.emitterCompanySiret);
    registryFields.isTransportedWasteFor.push(form.transporterCompanySiret);
    if (form.traderCompanySiret) {
      registryFields.isManagedWasteFor.push(form.traderCompanySiret);
    }
    if (form.brokerCompanySiret) {
      registryFields.isManagedWasteFor.push(form.brokerCompanySiret);
    }
  }

  return registryFields;
}

function toGenericWaste(bsdd: Bsdd): GenericWaste {
  return {
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    pop: bsdd.pop,
    id: bsdd.id,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    ecoOrganismeSiren: bsdd.ecoOrganismeSiret?.slice(0, 9),
    bsdType: "BSDD",
    status: bsdd.status,
    customId: bsdd.customId,
    destinationCap: bsdd.destinationCap,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsdd.destinationOperationDate,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    transporterRecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    wasteAdr: bsdd.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
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

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    ...genericWaste,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteName,
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    ...initialEmitter,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    transporterCompanyMail: bsdd.transporterCompanyMail,
    destinationOperationCode: bsdd.destinationOperationCode,
    destinationCustomInfo: null,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    transporter2CompanyName: bsdd.transporter2CompanyName,
    transporter2CompanySiret: bsdd.transporter2CompanySiret,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber,
    transporter2CompanyMail: bsdd.transporter2CompanyMail,
    transporter3CompanyName: bsdd.transporter3CompanyName,
    transporter3CompanySiret: bsdd.transporter3CompanySiret,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber,
    transporter3CompanyMail: bsdd.transporter3CompanyMail
  };
}

export function toIncomingWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  } & { transportSegments: TransportSegment[] },
  sirets: string[]
): IncomingWaste[] {
  const bsdd = formToBsdd(form);

  if (bsdd.forwarding) {
    // In case of temporary storage, a form can be flagged as incoming waste
    // either for the TTR or for the final destination. Here we compute two "virtual"
    // BSDDs, one from the emitter to the TTR and one from the TTR to the final destination
    const incomingWastes: IncomingWaste[] = [];

    if (sirets.includes(bsdd.forwarding.destinationCompanySiret)) {
      // add a record only if TTR is present in the sirets
      incomingWastes.push(
        toIncomingWaste({ ...bsdd.forwarding, forwarding: null })
      );
    }
    if (
      bsdd.destinationReceptionSignatureDate &&
      sirets.includes(bsdd.destinationCompanySiret)
    ) {
      // add a record only if final destination is present in the sirets
      incomingWastes.push(toIncomingWaste(bsdd));
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

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    ...genericWaste,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteName,
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    ...initialEmitter,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    transporterCompanyAddress: bsdd.transporterCompanyAddress,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    transporterCompanyMail: bsdd.transporterCompanyMail,
    weight: bsdd.weightValue,
    emitterCustomInfo: null,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    transporter2CompanyAddress: bsdd.transporter2CompanyAddress,
    transporter2CompanyName: bsdd.transporter2CompanyName,
    transporter2CompanySiret: bsdd.transporter2CompanySiret,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber,
    transporter2CompanyMail: bsdd.transporter2CompanyMail,
    transporter3CompanyAddress: bsdd.transporter3CompanyAddress,
    transporter3CompanyName: bsdd.transporter3CompanyName,
    transporter3CompanySiret: bsdd.transporter3CompanySiret,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber,
    transporter3CompanyMail: bsdd.transporter3CompanyMail
  };
}

export function toOutgoingWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  } & { transportSegments: TransportSegment[] },
  sirets: string[]
): OutgoingWaste[] {
  const bsdd = formToBsdd(form);

  if (bsdd.forwarding) {
    // In case of temporary storage, a form can be flagged as outgoing waste
    // either for the emitter or for the TTR. Here we compute two "virtual"
    // BSDDs, one from the emitter to the TTR and one from the TTR to the final destination
    const outgoingWastes: OutgoingWaste[] = [];

    if (sirets.includes(bsdd.forwarding.emitterCompanySiret)) {
      // add a record only if initial emitter is present in the sirets
      outgoingWastes.push(
        toOutgoingWaste({ ...bsdd.forwarding, forwarding: null })
      );
    }
    if (
      bsdd.transporterTransportSignatureDate &&
      sirets.includes(bsdd.emitterCompanySiret)
    ) {
      // add a record only if TTR is present in the sirets
      outgoingWastes.push(toOutgoingWaste(bsdd));
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

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    ...genericWaste,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    weight: bsdd.weightValue,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterCompanyAddress: bsdd.transporterCompanyAddress,
    transporterNumberPlates: bsdd.transporterNumberPlates,
    transporter2CompanyName: bsdd.transporter2CompanyName,
    transporter2CompanySiret: bsdd.transporter2CompanySiret,
    transporter2CompanyAddress: bsdd.transporter2CompanyAddress,
    transporter2NumberPlates: bsdd.transporter2NumberPlates,
    transporter3CompanyName: bsdd.transporter3CompanyName,
    transporter3CompanySiret: bsdd.transporter3CompanySiret,
    transporter3CompanyAddress: bsdd.transporter3CompanyAddress,
    transporter3NumberPlates: bsdd.transporter3NumberPlates,
    ...initialEmitter,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteName,
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    transporterCustomInfo: bsdd.transporterCustomInfo,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail
  };
}

export function toTransportedWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  } & { transportSegments: TransportSegment[] },
  sirets: string[]
): TransportedWaste[] {
  const bsdd = formToBsdd(form);

  if (bsdd.forwarding) {
    // In case of temporary storage, a form can be flagged as transported waste
    // either for the first transporter or for the transporter after temp storage.
    // Here we compute two "virtual" BSDDs, one from the emitter to the TTR and
    // one from the TTR to the final destination
    const transportedWastes: TransportedWaste[] = [];

    if (
      sirets.includes(bsdd.forwarding.transporterCompanySiret) ||
      sirets.includes(bsdd.forwarding.transporter2CompanySiret) ||
      sirets.includes(bsdd.forwarding.transporter3CompanySiret)
    ) {
      // add a record only if one of the initial transporters is present in the sirets
      transportedWastes.push(
        toTransportedWaste({ ...bsdd.forwarding, forwarding: null })
      );
    }
    if (
      bsdd.transporterTransportSignatureDate &&
      sirets.includes(bsdd.transporterCompanySiret)
    ) {
      // add a record only if second transporter is present in the sirets
      transportedWastes.push(toTransportedWaste(bsdd));
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

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    ...genericWaste,
    managedStartDate: null,
    managedEndDate: null,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteName,
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    ...initialEmitter,
    transporterCompanyAddress: bsdd.transporterCompanyAddress,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    transporterCompanyMail: bsdd.transporterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    transporter2CompanyAddress: bsdd.transporter2CompanyAddress,
    transporter2CompanyName: bsdd.transporter2CompanyName,
    transporter2CompanySiret: bsdd.transporter2CompanySiret,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber,
    transporter3CompanyAddress: bsdd.transporter3CompanyAddress,
    transporter3CompanyName: bsdd.transporter3CompanyName,
    transporter3CompanySiret: bsdd.transporter3CompanySiret,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber
  };
}

export function toManagedWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  } & { transportSegments: TransportSegment[] }
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

  if (bsdd.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsdd.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsdd);

  return {
    ...genericWaste,
    createdAt: bsdd.createdAt,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationOperationCode: bsdd.destinationOperationCode,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsdd.emitterCompanyAddress,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteName,
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    ...initialEmitter,
    transporterCompanyAddress: bsdd.transporterCompanyAddress,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    transporterCompanyMail: bsdd.transporterCompanyMail,
    weight: bsdd.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    transporter2CompanyAddress: bsdd.transporter2CompanyAddress,
    transporter2CompanyName: bsdd.transporter2CompanyName,
    transporter2CompanySiret: bsdd.transporter2CompanySiret,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber,
    transporter2CompanyMail: bsdd.transporter2CompanyMail,
    transporter3CompanyAddress: bsdd.transporter3CompanyAddress,
    transporter3CompanyName: bsdd.transporter3CompanyName,
    transporter3CompanySiret: bsdd.transporter3CompanySiret,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber,
    transporter3CompanyMail: bsdd.transporter3CompanyMail
  };
}

export function toAllWastes(
  form: Form & { temporaryStorageDetail: TemporaryStorageDetail } & {
    appendix2Forms: Form[];
  } & { transportSegments: TransportSegment[] },
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
