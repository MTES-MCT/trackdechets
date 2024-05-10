import { BsddFinalOperation } from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import { BsdElastic } from "../common/elastic";
import { buildAddress } from "../companies/sirene/utils";
import {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "../generated/graphql/types";
import {
  GenericWaste,
  emptyAllWaste,
  emptyIncomingWaste,
  emptyManagedWaste,
  emptyOutgoingWaste,
  emptyTransportedWaste
} from "../registry/types";
import { extractPostalCode } from "../utils";
import { Bsdd } from "./types";
import { FormForElastic } from "./elastic";
import { formToBsdd } from "./compat";

const getOperationData = (bsdd: Bsdd) => ({
  destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
  destinationOperationCode: bsdd.destinationOperationCode,
  destinationOperationMode: bsdd.destinationOperationMode
});

const getTransportersData = (bsdd: Bsdd) => ({
  transporterRecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
  transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
  transporterCompanyAddress: bsdd.transporterCompanyAddress,
  transporterCompanyName: bsdd.transporterCompanyName,
  transporterCompanySiret: bsdd.transporterCompanySiret,
  transporterRecepisseNumber: bsdd.transporterRecepisseNumber,
  transporterNumberPlates: bsdd.transporterNumberPlates,
  transporterCompanyMail: bsdd.transporterCompanyMail,
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
});

type RegistryFields =
  | "isIncomingWasteFor"
  | "isOutgoingWasteFor"
  | "isTransportedWasteFor"
  | "isManagedWasteFor";

export function getRegistryFields(
  form: FormForElastic
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
  }

  if (form.sentAt) {
    if (form.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(form.emitterCompanySiret);
    }
    if (form.ecoOrganismeSiret) {
      registryFields.isOutgoingWasteFor.push(form.ecoOrganismeSiret);
    }
    if (form.traderCompanySiret) {
      registryFields.isManagedWasteFor.push(form.traderCompanySiret);
    }
    if (form.brokerCompanySiret) {
      registryFields.isManagedWasteFor.push(form.brokerCompanySiret);
    }

    if (form.intermediaries?.length) {
      for (const intermediary of form.intermediaries) {
        const intermediaryOrgId = intermediary.siret ?? intermediary.vatNumber;
        if (intermediaryOrgId) {
          registryFields.isManagedWasteFor.push(intermediaryOrgId);
        }
      }
    }
  }

  for (const transporter of form.transporters ?? []) {
    if (transporter.takenOverAt) {
      const transporterCompanyOrgId = getTransporterCompanyOrgId(transporter);
      if (transporterCompanyOrgId) {
        registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
      }
    }
  }

  return registryFields;
}

/**
 * Return finalOperations
 * maintaining the order
 */
const getFinalOperationsData = (
  bsdd: Bsdd & {
    finalOperations: BsddFinalOperation[];
  }
): Pick<
  OutgoingWaste | AllWaste,
  "destinationFinalOperationCodes" | "destinationFinalOperationWeights"
> => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  // Check if finalOperations is defined and has elements
  if (bsdd.finalOperations && bsdd.finalOperations.length > 0) {
    // Iterate through each operation once and fill both arrays
    bsdd.finalOperations.forEach(ope => {
      destinationFinalOperationCodes.push(ope.operationCode);
      destinationFinalOperationWeights.push(ope.quantity.toNumber());
    });
  }
  return { destinationFinalOperationCodes, destinationFinalOperationWeights };
};

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
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    wasteAdr: bsdd.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    ...getTransportersData(bsdd)
  };
}

export function toIncomingWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<IncomingWaste> {
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
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
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
    destinationCustomInfo: null,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    ...getOperationData(bsdd)
  };
}

export function toOutgoingWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<OutgoingWaste> {
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
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyOutgoingWaste,
    ...genericWaste,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
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
    weight: bsdd.weightValue,
    emitterCustomInfo: null,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    ...getOperationData(bsdd),
    ...getFinalOperationsData(bsdd)
  };
}

export function toTransportedWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<TransportedWaste> {
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
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    weight: bsdd.weightValue,
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
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail
  };
}

export function toManagedWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<ManagedWaste> {
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
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
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
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail
  };
}

export function toAllWaste(
  bsdd: ReturnType<typeof formToBsdd>
): Required<AllWaste> {
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
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyAllWaste,
    ...genericWaste,
    createdAt: bsdd.createdAt,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    destinationCompanyAddress: bsdd.destinationCompanyAddress,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanySiret: bsdd.destinationCompanySiret,
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
    weight: bsdd.weightValue,
    managedEndDate: null,
    managedStartDate: null,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    ...getOperationData(bsdd),
    ...getFinalOperationsData(bsdd)
  };
}
