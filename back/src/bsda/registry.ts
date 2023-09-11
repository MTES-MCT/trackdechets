import { Bsda } from "@prisma/client";
import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
import { BsdElastic } from "../common/elastic";
import { buildAddress } from "../companies/sirene/utils";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import { GenericWaste } from "../registry/types";
import { extractPostalCode } from "../utils";

type RegistryFields =
  | "isIncomingWasteFor"
  | "isOutgoingWasteFor"
  | "isTransportedWasteFor"
  | "isManagedWasteFor";
export function getRegistryFields(
  bsda: Bsda
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: []
  };

  if (bsda.transporterTransportSignatureDate) {
    if (bsda.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsda.emitterCompanySiret);
    }
    if (bsda.workerCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsda.workerCompanySiret);
    }

    const transporterCompanyOrgId = getTransporterCompanyOrgId(bsda);
    if (transporterCompanyOrgId) {
      registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
    }
    if (bsda.brokerCompanySiret) {
      registryFields.isManagedWasteFor.push(bsda.brokerCompanySiret);
    }
  }

  // There is no signature at reception on the BSDA so we use the operation signature
  if (bsda.destinationOperationSignatureDate && bsda.destinationCompanySiret) {
    registryFields.isIncomingWasteFor.push(bsda.destinationCompanySiret);
  }

  return registryFields;
}

function toGenericWaste(bsda: Bsda): GenericWaste {
  return {
    wasteDescription: bsda.wasteMaterialName,
    wasteCode: bsda.wasteCode,
    wasteIsDangerous: true,
    pop: false,
    id: bsda.id,
    createdAt: bsda.createdAt,
    updatedAt: bsda.updatedAt,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiren: bsda.ecoOrganismeSiret?.slice(0, 9),
    bsdType: "BSDA",
    status: bsda.status,
    customId: null,
    destinationCap: bsda.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsda.destinationOperationDate,
    destinationReceptionWeight: bsda.destinationReceptionWeight
      ? bsda.destinationReceptionWeight / 1000
      : bsda.destinationReceptionWeight,
    transporterRecepisseIsExempted: bsda.transporterRecepisseIsExempted,
    wasteAdr: bsda.wasteAdr,
    workerCompanyName: bsda.workerCompanyName,
    workerCompanySiret: bsda.workerCompanySiret,
    workerCompanyAddress: bsda.workerCompanyAddress
  };
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

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    ...genericWaste,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationReceptionDate: bsda.destinationReceptionDate,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    ...initialEmitter,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: null,
    transporterCompanyName: bsda.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(bsda),
    transporterRecepisseNumber: bsda.transporterRecepisseNumber,
    destinationOperationCode: bsda.destinationOperationCode,
    destinationOperationMode: bsda.destinationOperationMode,
    destinationCustomInfo: bsda.destinationCustomInfo,
    emitterCompanyMail: bsda.emitterCompanyMail,
    transporterCompanyMail: bsda.transporterCompanyMail
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

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    ...genericWaste,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    ...initialEmitter,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    transporterCompanyAddress: null,
    transporterCompanyName: bsda.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(bsda),
    transporterTakenOverAt:
      bsda.transporterTransportTakenOverAt ??
      bsda.transporterTransportSignatureDate,
    transporterRecepisseNumber: bsda.transporterRecepisseNumber,
    weight: bsda.weightValue ? bsda.weightValue / 1000 : bsda.weightValue,
    emitterCustomInfo: bsda.emitterCustomInfo,
    transporterCompanyMail: bsda.transporterCompanyMail,
    destinationCompanyMail: bsda.destinationCompanyMail
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

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    ...genericWaste,
    transporterTakenOverAt:
      bsda.transporterTransportTakenOverAt ??
      bsda.transporterTransportSignatureDate,
    destinationReceptionDate: bsda.destinationReceptionDate,
    weight: bsda.weightValue ? bsda.weightValue / 1000 : bsda.weightValue,
    transporterCompanyName: bsda.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(bsda),
    transporterCompanyAddress: bsda.transporterCompanyAddress,
    transporterNumberPlates: bsda.transporterTransportPlates,
    ...initialEmitter,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    transporterCustomInfo: bsda.transporterCustomInfo,
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

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    ...genericWaste,
    managedStartDate: null,
    managedEndDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    ...initialEmitter,
    transporterCompanyAddress: bsda.transporterCompanyAddress,
    transporterCompanyName: bsda.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(bsda),
    transporterRecepisseNumber: bsda.transporterRecepisseNumber,
    emitterCompanyMail: bsda.emitterCompanyMail,
    transporterCompanyMail: bsda.transporterCompanyMail,
    destinationCompanyMail: bsda.destinationCompanyMail
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

  if (bsda.grouping?.length > 0) {
    initialEmitter.initialEmitterPostalCodes = bsda.grouping
      .map(grouped => extractPostalCode(grouped.emitterCompanyAddress))
      .filter(s => !!s);
  }

  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    ...genericWaste,
    createdAt: bsda.createdAt,
    transporterTakenOverAt:
      bsda.transporterTransportTakenOverAt ??
      bsda.transporterTransportSignatureDate,
    destinationReceptionDate: bsda.destinationReceptionDate,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    destinationCompanyAddress: bsda.destinationCompanyAddress,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationOperationCode: bsda.destinationOperationCode,
    destinationOperationMode: bsda.destinationOperationMode,
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress(
      [
        bsda.emitterPickupSiteAddress,
        bsda.emitterPickupSitePostalCode,
        bsda.emitterPickupSiteCity
      ].filter(Boolean)
    ),
    ...initialEmitter,
    transporterCompanyAddress: bsda.transporterCompanyAddress,
    transporterCompanyName: bsda.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(bsda),
    transporterRecepisseNumber: bsda.transporterRecepisseNumber,
    transporterNumberPlates: bsda.transporterTransportPlates,
    weight: bsda.weightValue ? bsda.weightValue / 1000 : bsda.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsda.emitterCompanyMail,
    transporterCompanyMail: bsda.transporterCompanyMail,
    destinationCompanyMail: bsda.destinationCompanyMail
  };
}
