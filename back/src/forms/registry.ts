import { Form, TransportSegment } from "@prisma/client";
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
import { formToBsdd } from "./compat";
import { Bsdd } from "./types";

type RegistryFields =
  | "isIncomingWasteFor"
  | "isOutgoingWasteFor"
  | "isTransportedWasteFor"
  | "isManagedWasteFor";

export function getRegistryFields(
  form: Form & {
    transportSegments: TransportSegment[] | null;
  }
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: []
  };

  if (form.receivedAt) {
    if (form.recipientCompanySiret) {
      registryFields.isIncomingWasteFor.push(form.recipientCompanySiret);
    }

    const transporterCompanyOrgId = getTransporterCompanyOrgId(form);
    if (transporterCompanyOrgId) {
      registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
    }

    if (form.transportSegments?.length) {
      for (const transportSegment of form.transportSegments) {
        if (transportSegment.transporterCompanySiret) {
          registryFields.isTransportedWasteFor.push(
            transportSegment.transporterCompanySiret
          );
        }
      }
    }
  }

  if (form.sentAt) {
    if (form.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(form.emitterCompanySiret);
    }
    if (form.transporterCompanySiret) {
      registryFields.isTransportedWasteFor.push(form.transporterCompanySiret);
    }
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
    wasteIsDangerous: bsdd.wasteIsDangerous,
    pop: bsdd.pop,
    id: bsdd.id,
    createdAt: bsdd.createdAt,
    updatedAt: bsdd.updatedAt,
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
  const initialEmitter: Record<string, string[] | null> = {
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
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
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

export function toOutgoingWaste(
  bsdd: Bsdd & { forwarding: Bsdd } & { grouping: Bsdd[] }
): OutgoingWaste {
  const initialEmitter: Record<string, string | string[] | null> = {
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
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
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

export function toTransportedWaste(
  bsdd: Bsdd & { forwarding: Bsdd } & { grouping: Bsdd[] }
): TransportedWaste {
  const initialEmitter: Record<string, string[] | null> = {
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
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
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

export function toManagedWaste(
  bsdd: Bsdd & { forwarding: Bsdd | null } & { grouping: Bsdd[] }
): ManagedWaste {
  const initialEmitter: Record<string, string[] | null> = {
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
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
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
  form: Form & { forwarding: Form } & {
    grouping: { initialForm: Form }[];
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
  const initialEmitter: Record<string, string[] | null> = {
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
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bsdd.emitterPickupSiteAddress,
      bsdd.emitterPickupSitePostalCode,
      bsdd.emitterPickupSiteCity
    ]),
    ...initialEmitter,
    transporterCompanyAddress: bsdd.transporterCompanyAddress,
    transporterCompanyName: bsdd.transporterCompanyName,
    transporterCompanySiret: bsdd.transporterCompanySiret,
    transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
    transporterNumberPlates: bsdd.transporterNumberPlates,
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
    transporter2NumberPlates: bsdd.transporter2NumberPlates,
    transporter2CompanyMail: bsdd.transporter2CompanyMail,
    transporter3CompanyAddress: bsdd.transporter3CompanyAddress,
    transporter3CompanyName: bsdd.transporter3CompanyName,
    transporter3CompanySiret: bsdd.transporter3CompanySiret,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber,
    transporter3NumberPlates: bsdd.transporter3NumberPlates,
    transporter3CompanyMail: bsdd.transporter3CompanyMail
  };
}
