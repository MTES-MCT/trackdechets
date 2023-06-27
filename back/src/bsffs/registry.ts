import { Bsff, BsffPackaging, BsffType } from "@prisma/client";
import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
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
import { toBsffDestination } from "./compat";

type BsffPackagingWithPrevious = BsffPackaging & {
  previousPackagings: BsffPackaging & { bsff: Bsff };
};

type RegistryFields =
  | "isIncomingWasteFor"
  | "isOutgoingWasteFor"
  | "isTransportedWasteFor"
  | "isManagedWasteFor";

export function getRegistryFields(
  bsff: Bsff
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: []
  };

  if (
    bsff.emitterEmissionSignatureDate &&
    bsff.transporterTransportSignatureDate
  ) {
    if (bsff.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsff.emitterCompanySiret);
    }
    registryFields.isOutgoingWasteFor.push(...bsff.detenteurCompanySirets);

    const transporterOrgId = getTransporterCompanyOrgId(bsff);
    if (transporterOrgId) {
      registryFields.isTransportedWasteFor.push(transporterOrgId);
    }
  }

  if (bsff.destinationReceptionSignatureDate && bsff.destinationCompanySiret) {
    registryFields.isIncomingWasteFor.push(bsff.destinationCompanySiret);
  }

  return registryFields;
}

function toGenericWaste(
  bsff: Bsff & {
    packagings: BsffPackagingWithPrevious[];
  }
): GenericWaste {
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
    status: bsff.status,
    customId: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsffDestination.receptionAcceptationStatus,
    destinationOperationDate: bsffDestination.operationDate,
    destinationReceptionWeight: bsffDestination.receptionWeight
      ? bsffDestination.receptionWeight / 1000
      : bsffDestination.receptionWeight,
    destinationOperationCode: bsffDestination.operationCode,
    transporterRecepisseIsExempted: false,
    wasteAdr: bsff.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null
  };
}

export function toIncomingWaste(
  bsff: Bsff & {
    packagings: BsffPackagingWithPrevious[];
  }
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
    transporterCompanyName: bsff.transporterCompanyName,
    transporterCompanySiret: bsff.transporterCompanySiret,
    transporterRecepisseNumber: bsff.transporterRecepisseNumber,
    destinationCustomInfo: bsff.destinationCustomInfo,
    emitterCompanyMail: bsff.emitterCompanyMail,
    transporterCompanyMail: bsff.transporterCompanyMail
  };
}

export function toOutgoingWaste(
  bsff: Bsff & {
    packagings: BsffPackagingWithPrevious[];
  }
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
  bsff: Bsff & {
    packagings: BsffPackagingWithPrevious[];
  }
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
  bsff: Bsff & {
    packagings: BsffPackagingWithPrevious[];
  }
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
  bsff: Bsff & {
    packagings: BsffPackagingWithPrevious[];
  }
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
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationPlannedOperationMode: null,
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
