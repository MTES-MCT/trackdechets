import { Bspaoh, BspaohTransporter } from "@prisma/client";
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
  RegistryFields,
  emptyAllWaste,
  emptyIncomingWaste,
  emptyManagedWaste,
  emptyOutgoingWaste,
  emptyTransportedWaste
} from "../registry/types";

import { getWasteDescription } from "./utils";
import { getFirstTransporterSync } from "./converter";

const getInitialEmitterData = () => {
  const initialEmitter: Record<string, string | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  return initialEmitter;
};

const getTransporterData = (
  bspaoh: Bspaoh & {
    transporters: BspaohTransporter[];
  },
  includePlates = false
) => {
  const transporter = getFirstTransporterSync(bspaoh);
  const data = {
    transporterRecepisseIsExempted: transporter?.transporterRecepisseIsExempted,
    transporterCompanyAddress: transporter?.transporterCompanyAddress,
    transporterCompanyName: transporter?.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    transporterRecepisseNumber: transporter?.transporterRecepisseNumber,
    transporterCompanyMail: transporter?.transporterCompanyMail,
    transporterCustomInfo: transporter?.transporterCustomInfo,
    transporterTakenOverAt: transporter?.transporterTakenOverAt,
    transporterTransportMode: transporter?.transporterTransportMode,
    // when switching to multi-modal
    // if this is on the transporter, use it
    // if it stays on the BSPAOH temporarily, attach it to the last transporter
    transporterHandedOverSignatureDate:
      bspaoh.handedOverToDestinationSignatureDate ?? null
  };

  if (includePlates) {
    return {
      ...data,
      transporterNumberPlates: transporter?.transporterTransportPlates
    };
  }

  return data;
};

export function getRegistryFields(
  bspaoh: Bspaoh & {
    transporters: BspaohTransporter[] | null;
  }
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: [],
    isAllWasteFor: []
  };
  const transporter = getFirstTransporterSync(bspaoh);
  if (
    bspaoh.emitterEmissionSignatureDate &&
    transporter?.transporterTransportSignatureDate
  ) {
    if (bspaoh.destinationCompanySiret) {
      registryFields.isAllWasteFor.push(bspaoh.destinationCompanySiret);
    }
    if (bspaoh.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bspaoh.emitterCompanySiret);
      registryFields.isAllWasteFor.push(bspaoh.emitterCompanySiret);
    }

    if (bspaoh.transporters?.length) {
      for (const transporter of bspaoh.transporters) {
        const transporterCompanyOrgId = getTransporterCompanyOrgId(transporter);
        if (transporterCompanyOrgId) {
          registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
          registryFields.isAllWasteFor.push(transporterCompanyOrgId);
        }
      }
    }
  }

  if (
    bspaoh.destinationReceptionSignatureDate &&
    bspaoh.destinationCompanySiret
  ) {
    registryFields.isIncomingWasteFor.push(bspaoh.destinationCompanySiret);
  }

  return registryFields;
}

export function toGenericWaste(
  bspaoh: Bspaoh & {
    transporters: BspaohTransporter[];
  }
): GenericWaste {
  return {
    wasteDescription: bspaoh.wasteCode
      ? getWasteDescription(bspaoh.wasteType)
      : "",
    wasteCode: bspaoh.wasteCode,
    wasteIsDangerous: true,
    pop: false,
    id: bspaoh.id,
    createdAt: bspaoh.createdAt,
    updatedAt: bspaoh.updatedAt,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    bsdType: "BSPAOH",
    bsdSubType: "INITIAL",
    status: bspaoh.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bspaoh.destinationReceptionAcceptationStatus,
    destinationOperationDate: bspaoh.destinationOperationDate,
    destinationReceptionWeight:
      bspaoh.destinationReceptionWasteReceivedWeightValue,
    wasteAdr: bspaoh.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    destinationCompanyMail: bspaoh.destinationCompanyMail
  };
}

export function toIncomingWaste(
  bspaoh: Bspaoh & {
    transporters: BspaohTransporter[];
  }
): IncomingWaste {
  const { __typename, ...genericWaste } = toGenericWaste(bspaoh);
  const transporter = getFirstTransporterSync(bspaoh);
  return {
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationCompanyAddress: bspaoh.destinationCompanyAddress,
    destinationReceptionDate: bspaoh.destinationReceptionDate,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterCompanyAddress: bspaoh.emitterCompanyAddress,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bspaoh.emitterPickupSiteAddress,
      bspaoh.emitterPickupSitePostalCode,
      bspaoh.emitterPickupSiteCity
    ]),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    ...getTransporterData(bspaoh),
    transporterCompanyName: transporter?.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    transporterRecepisseNumber: transporter?.transporterRecepisseNumber,
    destinationPlannedOperationCode: bspaoh.destinationOperationCode,
    destinationOperationCode: bspaoh.destinationOperationCode,
    destinationOperationMode: "ELIMINATION",
    emitterCompanyMail: bspaoh.emitterCompanyMail,
    transporterCompanyMail: transporter?.transporterCompanyMail,
    ...getInitialEmitterData()
  };
}

export function toOutgoingWaste(
  bspaoh: Bspaoh & {
    transporters: BspaohTransporter[];
  }
): OutgoingWaste {
  const { __typename, ...genericWaste } = toGenericWaste(bspaoh);
  const transporter = getFirstTransporterSync(bspaoh);
  return {
    ...emptyOutgoingWaste,
    ...genericWaste,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bspaoh.destinationCompanyAddress,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationPlannedOperationCode: bspaoh.destinationOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterCompanyAddress: bspaoh.emitterCompanyAddress,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bspaoh.emitterPickupSiteAddress,
      bspaoh.emitterPickupSitePostalCode,
      bspaoh.emitterPickupSiteCity
    ]),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    ...getTransporterData(bspaoh),
    transporterCompanyAddress: transporter?.transporterCompanyAddress,
    transporterCompanyName: transporter?.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    transporterTakenOverAt: transporter?.transporterTakenOverAt,
    transporterRecepisseNumber: transporter?.transporterRecepisseNumber,
    weight: bspaoh.emitterWasteWeightValue
      ? bspaoh.emitterWasteWeightValue / 1000
      : bspaoh.emitterWasteWeightValue,
    transporterCompanyMail: transporter?.transporterCompanyMail,
    ...getInitialEmitterData()
  };
}

export function toTransportedWaste(
  bspaoh: Bspaoh & {
    transporters: BspaohTransporter[];
  }
): TransportedWaste {
  const transporter = getFirstTransporterSync(bspaoh);

  const { __typename, ...genericWaste } = toGenericWaste(bspaoh);

  return {
    ...emptyTransportedWaste,
    ...genericWaste,
    ...getTransporterData(bspaoh, true),
    transporterTakenOverAt: bspaoh.transporterTransportTakenOverAt,
    destinationReceptionDate: bspaoh.destinationReceptionDate,
    weight: bspaoh.emitterWasteWeightValue
      ? bspaoh.emitterWasteWeightValue / 1000
      : bspaoh.emitterWasteWeightValue,
    transporterCompanyName: transporter?.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    transporterCompanyAddress: transporter?.transporterCompanyAddress,
    transporterNumberPlates: transporter?.transporterTransportPlates,
    emitterCompanyAddress: bspaoh.emitterCompanyAddress,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bspaoh.emitterPickupSiteAddress,
      bspaoh.emitterPickupSitePostalCode,
      bspaoh.emitterPickupSiteCity
    ]),
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationCompanyAddress: bspaoh.destinationCompanyAddress,
    emitterCompanyMail: bspaoh.emitterCompanyMail
  };
}

/**
 * BSPAOH has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(
  bspaoh: Bspaoh & {
    transporters: BspaohTransporter[];
  }
): ManagedWaste {
  const transporter = getFirstTransporterSync(bspaoh);
  const { __typename, ...genericWaste } = toGenericWaste(bspaoh);

  return {
    ...emptyManagedWaste,
    ...genericWaste,
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    destinationCompanyAddress: bspaoh.destinationCompanyAddress,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationPlannedOperationCode: bspaoh.destinationOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bspaoh.emitterCompanyAddress,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bspaoh.emitterPickupSiteAddress,
      bspaoh.emitterPickupSitePostalCode,
      bspaoh.emitterPickupSiteCity
    ]),
    ...getTransporterData(bspaoh),
    transporterCompanyAddress: transporter?.transporterCompanyAddress,
    transporterCompanyName: transporter?.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    transporterRecepisseNumber: transporter?.transporterRecepisseNumber,
    emitterCompanyMail: bspaoh.emitterCompanyMail,
    transporterCompanyMail: transporter?.transporterCompanyMail
  };
}

export function toAllWaste(
  bspaoh: Bspaoh & {
    transporters: BspaohTransporter[];
  }
): AllWaste {
  const transporter = getFirstTransporterSync(bspaoh);
  const { __typename, ...genericWaste } = toGenericWaste(bspaoh);

  return {
    ...emptyAllWaste,
    ...genericWaste,
    ...getTransporterData(bspaoh, true),
    createdAt: bspaoh.createdAt,
    transporterTakenOverAt: transporter?.transporterTakenOverAt,
    destinationReceptionDate: bspaoh.destinationReceptionDate,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bspaoh.destinationCompanyAddress,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationOperationCode: bspaoh.destinationOperationCode,
    destinationOperationMode: "ELIMINATION",
    destinationPlannedOperationCode: bspaoh.destinationOperationCode,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bspaoh.emitterCompanyAddress,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: buildAddress([
      bspaoh.emitterPickupSiteAddress,
      bspaoh.emitterPickupSitePostalCode,
      bspaoh.emitterPickupSiteCity
    ]),
    transporterCompanyAddress: transporter?.transporterCompanyAddress,
    transporterCompanyName: transporter?.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    transporterRecepisseNumber: transporter?.transporterRecepisseNumber,
    transporterNumberPlates: transporter?.transporterTransportPlates,
    weight: bspaoh.emitterWasteWeightValue
      ? bspaoh.emitterWasteWeightValue / 1000
      : bspaoh.emitterWasteWeightValue,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bspaoh.emitterCompanyMail,
    transporterCompanyMail: transporter?.transporterCompanyMail,
    ...getInitialEmitterData()
  };
}
