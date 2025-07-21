import { Bsdasri } from "@prisma/client";
import {
  getIntermediaryCompanyOrgId,
  getTransporterCompanyOrgId
} from "@td/constants";
import { BsdElastic } from "../common/elastic";
import type {
  AllWaste,
  IncomingWaste,
  ManagedWaste,
  OutgoingWaste,
  TransportedWaste
} from "@td/codegen-back";
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
import { RegistryBsdasri } from "../registry/elastic";
import { getBsdasriSubType } from "../common/subTypes";
import { splitAddress } from "../common/addresses";
import { isFinalOperationCode } from "../common/operationCodes";
import { BsdasriForElastic } from "./elastic";

const getOperationData = (bsdasri: Bsdasri) => ({
  destinationPlannedOperationCode: bsdasri.destinationOperationCode,
  destinationOperationCode: bsdasri.destinationOperationCode,
  destinationOperationMode: bsdasri.destinationOperationMode
});

const getFinalOperationsData = (
  bsdasri: RegistryBsdasri
): Pick<
  OutgoingWaste | AllWaste,
  | "destinationFinalOperationCodes"
  | "destinationFinalOperationWeights"
  | "destinationFinalOperationCompanySirets"
> => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  const destinationFinalOperationCompanySirets: string[] = [];

  // Check if finalOperations is defined and has elements
  if (
    bsdasri.destinationOperationSignatureDate &&
    bsdasri.destinationOperationCode &&
    // Cf tra-14603 => si le code de traitement du bordereau initial est final,
    // aucun code d'Opération(s) finale(s) réalisée(s) par la traçabilité suite
    // ni de Quantité(s) liée(s) ne doit remonter dans les deux colonnes.
    !isFinalOperationCode(bsdasri.destinationOperationCode) &&
    bsdasri.finalOperations?.length
  ) {
    // Iterate through each operation once and fill both arrays
    bsdasri.finalOperations.forEach(ope => {
      destinationFinalOperationCodes.push(ope.operationCode);
      destinationFinalOperationWeights.push(
        // conversion en tonnes
        ope.quantity.dividedBy(1000).toDecimalPlaces(6).toNumber()
      );
      if (ope.finalBsdasri.destinationCompanySiret) {
        // cela devrait tout le temps être le cas
        destinationFinalOperationCompanySirets.push(
          ope.finalBsdasri.destinationCompanySiret
        );
      }
    });
  }
  return {
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  };
};

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

export const getTransporterData = (bsdasri: Bsdasri, includePlates = false) => {
  const {
    street: transporterCompanyAddress,
    postalCode: transporterCompanyPostalCode,
    city: transporterCompanyCity,
    country: transporterCompanyCountry
  } = splitAddress(
    bsdasri.transporterCompanyAddress,
    bsdasri.transporterCompanyVatNumber
  );

  const data = {
    transporterRecepisseIsExempted: bsdasri.transporterRecepisseIsExempted,
    transporterCompanyAddress,
    transporterCompanyPostalCode,
    transporterCompanyCity,
    transporterCompanyCountry,
    transporterCompanyName: bsdasri.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(bsdasri),
    transporterRecepisseNumber: bsdasri.transporterRecepisseNumber,
    transporterCompanyMail: bsdasri.transporterCompanyMail,
    transporterCustomInfo: bsdasri.transporterCustomInfo,
    transporterTakenOverAt: bsdasri.transporterTakenOverAt,
    transporterTransportMode: bsdasri.transporterTransportMode
  };

  if (includePlates) {
    return {
      ...data,
      transporterNumberPlates: bsdasri.transporterTransportPlates ?? null
    };
  }

  return data;
};

export function getRegistryFields(
  bsdasri: BsdasriForElastic
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: [],
    isAllWasteFor: []
  };

  if (bsdasri.transporterTransportSignatureDate) {
    if (bsdasri.destinationCompanySiret) {
      registryFields.isAllWasteFor.push(bsdasri.destinationCompanySiret);
    }
    if (bsdasri.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsdasri.emitterCompanySiret);
      registryFields.isAllWasteFor.push(bsdasri.emitterCompanySiret);
    }
    if (bsdasri.ecoOrganismeSiret) {
      registryFields.isOutgoingWasteFor.push(bsdasri.ecoOrganismeSiret);
      registryFields.isAllWasteFor.push(bsdasri.ecoOrganismeSiret);
    }
    const transporterCompanyOrgId = getTransporterCompanyOrgId(bsdasri);
    if (transporterCompanyOrgId) {
      registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
      registryFields.isAllWasteFor.push(transporterCompanyOrgId);
    }

    if (bsdasri.brokerCompanySiret) {
      registryFields.isManagedWasteFor.push(bsdasri.brokerCompanySiret);
      registryFields.isAllWasteFor.push(bsdasri.brokerCompanySiret);
    }
    if (bsdasri.traderCompanySiret) {
      registryFields.isManagedWasteFor.push(bsdasri.traderCompanySiret);
      registryFields.isAllWasteFor.push(bsdasri.traderCompanySiret);
    }

    if (bsdasri.intermediaries?.length) {
      for (const intermediary of bsdasri.intermediaries) {
        const intermediaryOrgId = getIntermediaryCompanyOrgId(intermediary);
        if (intermediaryOrgId) {
          registryFields.isManagedWasteFor.push(intermediaryOrgId);
          registryFields.isAllWasteFor.push(intermediaryOrgId);
        }
      }
    }
  }

  if (
    bsdasri.destinationReceptionSignatureDate &&
    bsdasri.destinationCompanySiret
  ) {
    registryFields.isIncomingWasteFor.push(bsdasri.destinationCompanySiret);
  }

  return registryFields;
}

export function toGenericWaste(bsdasri: Bsdasri): GenericWaste {
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsdasri.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsdasri.emitterCompanyAddress);

  return {
    wasteDescription: bsdasri.wasteCode
      ? getWasteDescription(bsdasri.wasteCode)
      : "",
    wasteCode: bsdasri.wasteCode,
    wasteIsDangerous: true,
    pop: false,
    id: bsdasri.id,
    createdAt: bsdasri.createdAt,
    updatedAt: bsdasri.updatedAt,
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    ecoOrganismeSiren: bsdasri.ecoOrganismeSiret?.slice(0, 9),
    bsdType: "BSDASRI",
    bsdSubType: getBsdasriSubType(bsdasri),
    status: bsdasri.status,
    customId: null,
    destinationCap: bsdasri.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsdasri.destinationOperationDate,
    destinationReceptionWeight: bsdasri.destinationReceptionWasteWeightValue
      ? bsdasri.destinationReceptionWasteWeightValue
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : null,
    wasteAdr: bsdasri.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    emitterPickupsiteName: bsdasri.emitterPickupSiteName,
    emitterPickupsiteAddress: bsdasri.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsdasri.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsdasri.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsdasri.emitterPickupSiteAddress ? "FR" : null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : null,
    ...getTransporterData(bsdasri)
  };
}

export function toIncomingWaste(
  bsdasri: RegistryBsdasri
): Required<IncomingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri),
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    traderCompanyName: bsdasri.traderCompanyName,
    traderCompanySiret: bsdasri.traderCompanySiret,
    traderRecepisseNumber: bsdasri.traderRecepisseNumber,
    brokerCompanyName: bsdasri.brokerCompanyName,
    brokerCompanySiret: bsdasri.brokerCompanySiret,
    brokerRecepisseNumber: bsdasri.brokerRecepisseNumber,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    ...getOperationData(bsdasri),
    ...getInitialEmitterData()
  };
}

export function toOutgoingWaste(
  bsdasri: RegistryBsdasri
): Required<OutgoingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyOutgoingWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri),
    destinationPlannedOperationMode: null,
    traderCompanyName: bsdasri.traderCompanyName,
    traderCompanySiret: bsdasri.traderCompanySiret,
    traderRecepisseNumber: bsdasri.traderRecepisseNumber,
    brokerCompanyName: bsdasri.brokerCompanyName,
    brokerCompanySiret: bsdasri.brokerCompanySiret,
    brokerRecepisseNumber: bsdasri.brokerRecepisseNumber,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : null,
    ...getOperationData(bsdasri),
    ...getFinalOperationsData(bsdasri),
    ...getInitialEmitterData()
  };
}

export function toTransportedWaste(
  bsdasri: RegistryBsdasri
): Required<TransportedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri, true),
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : null,
    traderCompanyName: bsdasri.traderCompanyName,
    traderCompanySiret: bsdasri.traderCompanySiret,
    traderRecepisseNumber: bsdasri.traderRecepisseNumber,
    brokerCompanyName: bsdasri.brokerCompanyName,
    brokerCompanySiret: bsdasri.brokerCompanySiret,
    brokerRecepisseNumber: bsdasri.brokerRecepisseNumber,
    emitterCompanyMail: bsdasri.emitterCompanyMail
  };
}

export function toManagedWaste(
  bsdasri: RegistryBsdasri
): Required<ManagedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri),
    traderCompanyName: bsdasri.traderCompanyName,
    traderCompanySiret: bsdasri.traderCompanySiret,

    brokerCompanyName: bsdasri.brokerCompanyName,
    brokerCompanySiret: bsdasri.brokerCompanySiret,

    destinationPlannedOperationMode: null,
    emitterCompanyMail: bsdasri.emitterCompanyMail
  };
}

export function toAllWaste(bsdasri: RegistryBsdasri): Required<AllWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsdasri);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyAllWaste,
    ...genericWaste,
    ...getTransporterData(bsdasri, true),
    createdAt: bsdasri.createdAt,
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    traderCompanyName: bsdasri.traderCompanyName,
    traderCompanySiret: bsdasri.traderCompanySiret,
    traderRecepisseNumber: bsdasri.traderRecepisseNumber,
    brokerCompanyName: bsdasri.brokerCompanyName,
    brokerCompanySiret: bsdasri.brokerCompanySiret,
    brokerRecepisseNumber: bsdasri.brokerRecepisseNumber,
    destinationPlannedOperationMode: null,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue.dividedBy(1000).toNumber()
      : null,

    emitterCompanyMail: bsdasri.emitterCompanyMail,
    ...getOperationData(bsdasri),
    ...getFinalOperationsData(bsdasri),
    ...getInitialEmitterData(),
    ...getIntermediariesData(bsdasri)
  };
}

const getIntermediariesData = (bsdasri: RegistryBsdasri) => ({
  intermediary1CompanyName: bsdasri.intermediaries?.[0]?.name ?? null,
  intermediary1CompanySiret: bsdasri.intermediaries?.[0]
    ? getIntermediaryCompanyOrgId(bsdasri.intermediaries[0])
    : null,
  intermediary2CompanyName: bsdasri.intermediaries?.[1]?.name ?? null,
  intermediary2CompanySiret: bsdasri.intermediaries?.[1]
    ? getIntermediaryCompanyOrgId(bsdasri.intermediaries[1])
    : null,
  intermediary3CompanyName: bsdasri.intermediaries?.[2]?.name ?? null,
  intermediary3CompanySiret: bsdasri.intermediaries?.[2]
    ? getIntermediaryCompanyOrgId(bsdasri.intermediaries[2])
    : null
});
