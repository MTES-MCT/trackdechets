import { Bsda } from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import { BsdElastic } from "../common/elastic";
import { buildAddress } from "../companies/sirene/utils";
import {
  AllWaste,
  BsdSubType,
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
import { getFirstTransporterSync, getTransportersSync } from "./database";
import { RegistryBsda } from "../registry/elastic";
import { BsdaForElastic } from "./elastic";
import { splitAddress } from "../common/addresses";

const getPostTempStorageDestination = (bsda: RegistryBsda) => {
  if (!bsda.forwardedIn) return {};

  const splittedAddress = splitAddress(
    bsda.forwardedIn.destinationCompanyAddress
  );

  return {
    postTempStorageDestinationName: bsda.forwardedIn.destinationCompanyName,
    postTempStorageDestinationSiret: bsda.forwardedIn.destinationCompanySiret,
    postTempStorageDestinationAddress: splittedAddress.street,
    postTempStorageDestinationPostalCode: splittedAddress.postalCode,
    postTempStorageDestinationCity: splittedAddress.city,
    // Always FR for now, as destination must be FR
    postTempStorageDestinationCountry: "FR"
  };
};

const getOperationData = (bsda: Bsda) => ({
  destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
  destinationOperationCode: bsda.destinationOperationCode,
  destinationOperationMode: bsda.destinationOperationMode
});

const getIntermediariesData = (bsda: RegistryBsda) => ({
  intermediary1CompanyName: bsda.intermediaries?.[0]?.name ?? null,
  intermediary1CompanySiret: bsda.intermediaries?.[0]?.siret ?? null,
  intermediary2CompanyName: bsda.intermediaries?.[1]?.name ?? null,
  intermediary2CompanySiret: bsda.intermediaries?.[1]?.siret ?? null,
  intermediary3CompanyName: bsda.intermediaries?.[2]?.name ?? null,
  intermediary3CompanySiret: bsda.intermediaries?.[2]?.siret ?? null
});

const getFinalOperationsData = (bsda: RegistryBsda) => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  // Check if finalOperations is defined and has elements
  if (bsda.finalOperations && bsda.finalOperations.length > 0) {
    // Iterate through each operation once and fill both arrays
    bsda.finalOperations.forEach(ope => {
      destinationFinalOperationCodes.push(ope.operationCode);
      destinationFinalOperationWeights.push(ope.quantity.toNumber());
    });
  }
  return { destinationFinalOperationCodes, destinationFinalOperationWeights };
};

const getInitialEmitterData = (bsda: RegistryBsda) => {
  const initialEmitter: Record<string, string | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  if (bsda.forwarding) {
    const { street, postalCode, city, country } = splitAddress(
      bsda.forwarding.emitterCompanyAddress
    );

    initialEmitter.initialEmitterCompanyAddress = street;
    initialEmitter.initialEmitterCompanyPostalCode = postalCode;
    initialEmitter.initialEmitterCompanyCity = city;
    initialEmitter.initialEmitterCompanyCountry = country;

    initialEmitter.initialEmitterCompanyName =
      bsda.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsda.forwarding.emitterCompanySiret;
  }

  return initialEmitter;
};

export const getTransportersData = (
  bsda: RegistryBsda,
  includePlates = false
) => {
  const transporters = getTransportersSync(bsda);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;

  const {
    street: transporterCompanyAddress,
    postalCode: transporterCompanyPostalCode,
    city: transporterCompanyCity,
    country: transporterCompanyCountry
  } = splitAddress(
    transporter.transporterCompanyAddress,
    transporter.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    transporter2?.transporterCompanyAddress,
    transporter2?.transporterCompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    transporter3?.transporterCompanyAddress,
    transporter3?.transporterCompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    transporter4?.transporterCompanyAddress,
    transporter4?.transporterCompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    transporter5?.transporterCompanyAddress,
    transporter5?.transporterCompanyVatNumber
  );

  const data = {
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    transporterCompanyAddress,
    transporterCompanyPostalCode,
    transporterCompanyCity,
    transporterCompanyCountry,
    transporterCompanyName: transporter?.transporterCompanyName,
    transporterCompanySiret: getTransporterCompanyOrgId(transporter),
    transporterRecepisseNumber: transporter?.transporterRecepisseNumber,
    transporterCompanyMail: transporter?.transporterCompanyMail,
    transporterRecepisseIsExempted: transporter?.transporterRecepisseIsExempted,
    transporterTransportMode: transporter?.transporterTransportMode,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2CompanyName: transporter2?.transporterCompanyName,
    transporter2CompanySiret: getTransporterCompanyOrgId(transporter2),
    transporter2RecepisseNumber: transporter2?.transporterRecepisseNumber,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,
    transporter2RecepisseIsExempted:
      transporter2?.transporterRecepisseIsExempted,
    transporter2TransportMode: transporter2?.transporterTransportMode,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3CompanyName: transporter3?.transporterCompanyName,
    transporter3CompanySiret: getTransporterCompanyOrgId(transporter3),
    transporter3RecepisseNumber: transporter3?.transporterRecepisseNumber,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,
    transporter3RecepisseIsExempted:
      transporter3?.transporterRecepisseIsExempted,
    transporter3TransportMode: transporter3?.transporterTransportMode,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4CompanyName: transporter4?.transporterCompanyName,
    transporter4CompanySiret: getTransporterCompanyOrgId(transporter4),
    transporter4RecepisseNumber: transporter4?.transporterRecepisseNumber,
    transporter4CompanyMail: transporter4?.transporterCompanyMail,
    transporter4RecepisseIsExempted:
      transporter4?.transporterRecepisseIsExempted,
    transporter4TransportMode: transporter4?.transporterTransportMode,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5CompanyName: transporter5?.transporterCompanyName,
    transporter5CompanySiret: getTransporterCompanyOrgId(transporter5),
    transporter5RecepisseNumber: transporter5?.transporterRecepisseNumber,
    transporter5CompanyMail: transporter5?.transporterCompanyMail,
    transporter5RecepisseIsExempted:
      transporter5?.transporterRecepisseIsExempted,
    transporter5TransportMode: transporter5?.transporterTransportMode
  };

  if (includePlates) {
    return {
      ...data,
      transporterNumberPlates: transporter?.transporterTransportPlates ?? null,
      transporter2NumberPlates:
        transporter2?.transporterTransportPlates ?? null,
      transporter3NumberPlates:
        transporter3?.transporterTransportPlates ?? null,
      transporter4NumberPlates:
        transporter4?.transporterTransportPlates ?? null,
      transporter5NumberPlates: transporter5?.transporterTransportPlates ?? null
    };
  }

  return data;
};

export function getRegistryFields(
  bsda: BsdaForElastic
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: [],
    isAllWasteFor: []
  };

  const transporter = getFirstTransporterSync(bsda);

  if (transporter?.transporterTransportSignatureDate) {
    registryFields.isOutgoingWasteFor = [
      bsda.emitterCompanySiret,
      bsda.ecoOrganismeSiret,
      bsda.workerCompanySiret
    ].filter(Boolean);

    registryFields.isAllWasteFor = [
      bsda.destinationCompanySiret,
      bsda.emitterCompanySiret,
      bsda.ecoOrganismeSiret,
      bsda.workerCompanySiret,
      bsda.brokerCompanySiret
    ].filter(Boolean);

    if (bsda.brokerCompanySiret) {
      registryFields.isManagedWasteFor.push(bsda.brokerCompanySiret);
    }

    if (bsda.intermediaries?.length) {
      for (const intermediary of bsda.intermediaries) {
        const intermediaryOrgId = intermediary.siret ?? intermediary.vatNumber;
        if (intermediaryOrgId) {
          registryFields.isManagedWasteFor.push(intermediaryOrgId);
          registryFields.isAllWasteFor.push(intermediaryOrgId);
        }
      }
    }
  }

  for (const transporter of bsda.transporters ?? []) {
    if (transporter.transporterTransportSignatureDate) {
      const transporterCompanyOrgId = getTransporterCompanyOrgId(transporter);
      if (transporterCompanyOrgId) {
        registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
        registryFields.isAllWasteFor.push(transporterCompanyOrgId);
      }
    }
  }

  // There is no signature at reception on the BSDA so we use the operation signature
  if (bsda.destinationOperationSignatureDate && bsda.destinationCompanySiret) {
    registryFields.isIncomingWasteFor.push(bsda.destinationCompanySiret);
  }

  return registryFields;
}

export const getSubType = (bsda: RegistryBsda): BsdSubType => {
  if (bsda.type === "OTHER_COLLECTIONS") {
    return "INITIAL";
  }

  return bsda.type;
};

export function toGenericWaste(bsda: RegistryBsda): GenericWaste {
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity,
    country: destinationCompanyCountry
  } = splitAddress(bsda.destinationCompanyAddress);

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
    bsdSubType: getSubType(bsda),
    status: bsda.status,
    customId: null,
    destinationCap: bsda.destinationCap,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    destinationOperationDate: bsda.destinationOperationDate,
    destinationReceptionWeight: bsda.destinationReceptionWeight
      ? bsda.destinationReceptionWeight.dividedBy(1000).toNumber()
      : null,

    wasteAdr: bsda.wasteAdr,
    workerCompanyName: bsda.workerCompanyName,
    workerCompanySiret: bsda.workerCompanySiret,
    workerCompanyAddress: bsda.workerCompanyAddress,
    destinationCompanyMail: bsda.destinationCompanyMail,
    brokerCompanyMail: bsda.brokerCompanyMail,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanySiret: bsda.destinationCompanySiret
  };
}

export function toIncomingWaste(bsda: RegistryBsda): Required<IncomingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationReceptionDate: bsda.destinationReceptionDate,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyAddress: bsda.emitterCompanyAddress,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
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
    emitterCompanyMail: bsda.emitterCompanyMail,
    ...getOperationData(bsda),
    nextDestinationProcessingOperation:
      bsda.destinationOperationNextDestinationPlannedOperationCode,
    ...getTransportersData(bsda),
    ...getInitialEmitterData(bsda)
  };
}

export function toOutgoingWaste(bsda: RegistryBsda): Required<OutgoingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyOutgoingWaste,
    ...genericWaste,
    ...getPostTempStorageDestination(bsda),
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
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
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    weight: bsda.weightValue
      ? bsda.weightValue.dividedBy(1000).toNumber()
      : null,
    ...getOperationData(bsda),
    ...getFinalOperationsData(bsda),
    nextDestinationProcessingOperation:
      bsda.destinationOperationNextDestinationPlannedOperationCode,
    ...getTransportersData(bsda),
    ...getInitialEmitterData(bsda)
  };
}

export function toTransportedWaste(
  bsda: RegistryBsda
): Required<TransportedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsda.destinationReceptionDate,
    weight: bsda.weightValue
      ? bsda.weightValue.dividedBy(1000).toNumber()
      : null,
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
    emitterCompanyMail: bsda.emitterCompanyMail,
    ...getTransportersData(bsda, true)
  };
}

export function toManagedWaste(bsda: RegistryBsda): Required<ManagedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
    ...genericWaste,
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
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
    emitterCompanyMail: bsda.emitterCompanyMail,
    destinationCompanyMail: bsda.destinationCompanyMail,
    nextDestinationProcessingOperation:
      bsda.destinationOperationNextDestinationPlannedOperationCode,
    ...getTransportersData(bsda)
  };
}

export function toAllWaste(bsda: RegistryBsda): Required<AllWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsda);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyAllWaste,
    ...genericWaste,
    ...getPostTempStorageDestination(bsda),
    createdAt: bsda.createdAt,
    destinationReceptionDate: bsda.destinationReceptionDate,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
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
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    weight: bsda.weightValue
      ? bsda.weightValue.dividedBy(1000).toNumber()
      : null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsda.emitterCompanyMail,
    ...getOperationData(bsda),
    ...getFinalOperationsData(bsda),
    nextDestinationProcessingOperation:
      bsda.destinationOperationNextDestinationPlannedOperationCode,
    ...getIntermediariesData(bsda),
    ...getTransportersData(bsda, true),
    ...getInitialEmitterData(bsda)
  };
}
