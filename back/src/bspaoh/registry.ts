import { Bspaoh, BspaohTransporter } from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import { BsdElastic } from "../common/elastic";
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
import { getBspaohSubType } from "../common/subTypes";
import { splitAddress } from "../common/addresses";
import Decimal from "decimal.js";

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

export const getTransporterData = (
  bspaoh: Bspaoh & {
    transporters: BspaohTransporter[];
  },
  includePlates = false
) => {
  const transporter = getFirstTransporterSync(bspaoh);

  const {
    street: transporterCompanyAddress,
    postalCode: transporterCompanyPostalCode,
    city: transporterCompanyCity,
    country: transporterCompanyCountry
  } = splitAddress(
    transporter?.transporterCompanyAddress,
    transporter?.transporterCompanyVatNumber
  );

  const data = {
    transporterRecepisseIsExempted: transporter?.transporterRecepisseIsExempted,
    transporterCompanyAddress,
    transporterCompanyPostalCode,
    transporterCompanyCity,
    transporterCompanyCountry,
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
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bspaoh.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bspaoh.emitterCompanyAddress);

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
    bsdSubType: getBspaohSubType(bspaoh),
    status: bspaoh.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bspaoh.destinationReceptionAcceptationStatus,
    destinationOperationDate: bspaoh.destinationOperationDate,
    destinationReceptionWeight:
      bspaoh.destinationReceptionWasteReceivedWeightValue
        ? new Decimal(bspaoh.destinationReceptionWasteReceivedWeightValue)
            .dividedBy(1000)
            .toDecimalPlaces(6)
            .toNumber()
        : bspaoh.destinationReceptionWasteReceivedWeightValue,
    wasteAdr: bspaoh.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    destinationCompanyMail: bspaoh.destinationCompanyMail,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: bspaoh.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bspaoh.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bspaoh.emitterPickupSiteCity,
    emitterPickupsiteCountry: bspaoh.emitterPickupSiteAddress ? "FR" : null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    weight: bspaoh.emitterWasteWeightValue
      ? new Decimal(bspaoh.emitterWasteWeightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bspaoh.emitterWasteWeightValue,
    ...getTransporterData(bspaoh)
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
    destinationReceptionDate: bspaoh.destinationReceptionDate,
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
    destinationPlannedOperationCode: bspaoh.destinationOperationCode,
    destinationPlannedOperationMode: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    ...getTransporterData(bspaoh),
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
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
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
    destinationPlannedOperationCode: bspaoh.destinationOperationCode,
    destinationPlannedOperationMode: null,
    ...getTransporterData(bspaoh),
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
    destinationOperationCode: bspaoh.destinationOperationCode,
    destinationOperationMode: "ELIMINATION",
    destinationPlannedOperationCode: bspaoh.destinationOperationCode,
    destinationPlannedOperationMode: null,
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
