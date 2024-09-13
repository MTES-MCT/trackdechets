import { Bsvhu } from "@prisma/client";
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
import { getBsvhuSubType } from "../common/subTypes";
import { splitAddress } from "../common/addresses";
import Decimal from "decimal.js";
import { RegistryBsvhu } from "../registry/elastic";
import { getIntermediaryCompanyOrgId } from "@td/constants";
import { BsvhuForElastic } from "./elastic";

const getOperationData = (bsvhu: Bsvhu) => ({
  destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
  destinationOperationCode: bsvhu.destinationOperationCode,
  destinationOperationMode: bsvhu.destinationOperationMode
});

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

export const getTransporterData = (bsvhu: Bsvhu, includePlates = false) => {
  const {
    street: transporterCompanyAddress,
    postalCode: transporterCompanyPostalCode,
    city: transporterCompanyCity,
    country: transporterCompanyCountry
  } = splitAddress(
    bsvhu.transporterCompanyAddress,
    bsvhu.transporterCompanyVatNumber
  );

  const data = {
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    transporterRecepisseIsExempted: bsvhu.transporterRecepisseIsExempted,
    transporterCompanyName: bsvhu.transporterCompanyName,
    transporterCompanySiret: bsvhu.transporterCompanySiret,
    transporterRecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporterCompanyMail: bsvhu.transporterCompanyMail,
    transporterCustomInfo: bsvhu.transporterCustomInfo,
    transporterCompanyAddress,
    transporterCompanyPostalCode,
    transporterCompanyCity,
    transporterCompanyCountry
  };

  if (includePlates) {
    return {
      ...data,
      transporterNumberPlates: bsvhu.transporterTransportPlates
    };
  }

  return data;
};

const getIntermediariesData = (bsda: RegistryBsvhu) => ({
  intermediary1CompanyName: bsda.intermediaries?.[0]?.name ?? null,
  intermediary1CompanySiret: bsda.intermediaries?.[0]
    ? getIntermediaryCompanyOrgId(bsda.intermediaries[0])
    : null,
  intermediary2CompanyName: bsda.intermediaries?.[1]?.name ?? null,
  intermediary2CompanySiret: bsda.intermediaries?.[1]
    ? getIntermediaryCompanyOrgId(bsda.intermediaries[1])
    : null,
  intermediary3CompanyName: bsda.intermediaries?.[2]?.name ?? null,
  intermediary3CompanySiret: bsda.intermediaries?.[2]
    ? getIntermediaryCompanyOrgId(bsda.intermediaries[2])
    : null
});

export function getRegistryFields(
  bsvhu: BsvhuForElastic
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: [],
    isAllWasteFor: []
  };

  if (
    bsvhu.emitterEmissionSignatureDate &&
    bsvhu.transporterTransportSignatureDate
  ) {
    if (bsvhu.destinationCompanySiret) {
      registryFields.isAllWasteFor.push(bsvhu.destinationCompanySiret);
    }
    if (bsvhu.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsvhu.emitterCompanySiret);
      registryFields.isAllWasteFor.push(bsvhu.emitterCompanySiret);
    }
    if (bsvhu.transporterCompanySiret) {
      registryFields.isTransportedWasteFor.push(bsvhu.transporterCompanySiret);
      registryFields.isAllWasteFor.push(bsvhu.transporterCompanySiret);
    }
    if (bsvhu.intermediaries?.length) {
      for (const intermediary of bsvhu.intermediaries) {
        const intermediaryOrgId = getIntermediaryCompanyOrgId(intermediary);
        if (intermediaryOrgId) {
          registryFields.isManagedWasteFor.push(intermediaryOrgId);
          registryFields.isAllWasteFor.push(intermediaryOrgId);
        }
      }
    }
  }

  if (
    bsvhu.destinationOperationSignatureDate &&
    bsvhu.destinationCompanySiret
  ) {
    registryFields.isIncomingWasteFor.push(bsvhu.destinationCompanySiret);
  }

  return registryFields;
}

export function toGenericWaste(bsvhu: RegistryBsvhu): GenericWaste {
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsvhu.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = bsvhu.emitterCompanyStreet &&
  bsvhu.emitterCompanyPostalCode &&
  bsvhu.emitterCompanyCity
    ? {
        street: bsvhu.emitterCompanyStreet,
        postalCode: bsvhu.emitterCompanyPostalCode,
        city: bsvhu.emitterCompanyCity,
        country: "FR"
      }
    : splitAddress(bsvhu.emitterCompanyAddress);

  return {
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    wasteIsDangerous: true,
    pop: false,
    id: bsvhu.id,
    createdAt: bsvhu.createdAt,
    updatedAt: bsvhu.createdAt,
    ecoOrganismeName: null,
    ecoOrganismeSiren: null,
    bsdType: "BSVHU",
    bsdSubType: getBsvhuSubType(bsvhu),
    status: bsvhu.status,
    customId: null,
    destinationCap: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsvhu.destinationOperationDate,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? new Decimal(bsvhu.destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.destinationReceptionWeight,
    wasteAdr: null,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    emitterPickupsiteAddress: null,
    emitterPickupsitePostalCode: null,
    emitterPickupsiteCity: null,
    emitterPickupsiteCountry: null,
    emitterPickupsiteName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyIrregularSituation: !!bsvhu.emitterIrregularSituation,
    weight: bsvhu.weightValue
      ? new Decimal(bsvhu.weightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.weightValue,
    ...getTransporterData(bsvhu)
  };
}

export function toIncomingWaste(bsvhu: RegistryBsvhu): Required<IncomingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    ...getOperationData(bsvhu),
    ...getTransporterData(bsvhu),
    ...getInitialEmitterData()
  };
}

export function toOutgoingWaste(bsvhu: RegistryBsvhu): Required<OutgoingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyOutgoingWaste,
    ...genericWaste,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationPlannedOperationMode: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    ...getOperationData(bsvhu),
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    ...getOperationData(bsvhu),
    ...getTransporterData(bsvhu),
    ...getInitialEmitterData()
  };
}

export function toTransportedWaste(
  bsvhu: RegistryBsvhu
): Required<TransportedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    ...getTransporterData(bsvhu, true)
  };
}

/**
 * BSVHU has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(bsvhu: RegistryBsvhu): Required<ManagedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
    ...genericWaste,
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    destinationPlannedOperationMode: null,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    ...getTransporterData(bsvhu)
  };
}

export function toAllWaste(bsvhu: RegistryBsvhu): Required<AllWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsvhu);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyAllWaste,
    ...genericWaste,
    createdAt: bsvhu.createdAt,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationPlannedOperationMode: null,
    weight: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    ...getOperationData(bsvhu),
    ...getTransporterData(bsvhu, true),
    ...getInitialEmitterData(),
    ...getIntermediariesData(bsvhu)
  };
}
