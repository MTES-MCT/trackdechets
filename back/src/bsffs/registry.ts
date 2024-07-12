import { BsffType, OperationMode } from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import { BsdElastic } from "../common/elastic";
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
import { toBsffDestination } from "./compat";
import { RegistryBsff } from "../registry/elastic";
import { getFirstTransporterSync, getTransportersSync } from "./database";
import { BsffWithTransporters } from "./types";
import { splitAddress } from "../common/addresses";

const getOperationData = (bsff: RegistryBsff) => {
  const bsffDestination = toBsffDestination(bsff.packagings);

  return {
    destinationOperationCode: bsffDestination.operationCode,
    destinationOperationMode: bsffDestination.operationMode as OperationMode,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode
  };
};

const getFinalOperationsData = (bsff: RegistryBsff) => {
  const destinationFinalOperationCodes: string[] = [];
  const destinationFinalOperationWeights: number[] = [];
  // Check if finalOperations is defined and has elements
  for (const packaging of bsff.packagings) {
    if (packaging.finalOperations && packaging.finalOperations.length > 0) {
      // Iterate through each operation once and fill both arrays
      packaging.finalOperations.forEach(ope => {
        destinationFinalOperationCodes.push(ope.operationCode);
        destinationFinalOperationWeights.push(ope.quantity.toNumber());
      });
    }
  }

  return { destinationFinalOperationCodes, destinationFinalOperationWeights };
};

const getInitialEmitterData = (bsff: RegistryBsff) => {
  const initialEmitter: Record<string, string | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  if (bsff.type === BsffType.REEXPEDITION) {
    const initialBsff = bsff.packagings[0]?.previousPackagings[0]?.bsff;
    if (initialBsff) {
      const { street, postalCode, city, country } = splitAddress(
        initialBsff.emitterCompanyAddress
      );

      // Legagcy reexpedition BSFFs may have been created without linking to previous packagings
      initialEmitter.initialEmitterCompanyAddress = street;
      initialEmitter.initialEmitterCompanyPostalCode = postalCode;
      initialEmitter.initialEmitterCompanyCity = city;
      initialEmitter.initialEmitterCompanyCountry = country;

      initialEmitter.initialEmitterCompanyName = initialBsff.emitterCompanyName;
      initialEmitter.initialEmitterCompanySiret =
        initialBsff.emitterCompanySiret;
    }
  }

  return initialEmitter;
};

export const getTransportersData = (
  bsff: RegistryBsff,
  includePlates = false
) => {
  const transporters = getTransportersSync(bsff);

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
      transporterNumberPlates: transporter.transporterTransportPlates ?? null,
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
  bsff: BsffWithTransporters
): Pick<BsdElastic, RegistryFields> {
  const registryFields: Record<RegistryFields, string[]> = {
    isIncomingWasteFor: [],
    isOutgoingWasteFor: [],
    isTransportedWasteFor: [],
    isManagedWasteFor: [],
    isAllWasteFor: []
  };

  const transporter = getFirstTransporterSync(bsff);

  if (
    bsff.emitterEmissionSignatureDate &&
    transporter?.transporterTransportSignatureDate
  ) {
    if (bsff.destinationCompanySiret) {
      registryFields.isAllWasteFor.push(bsff.destinationCompanySiret);
    }
    if (bsff.emitterCompanySiret) {
      registryFields.isOutgoingWasteFor.push(bsff.emitterCompanySiret);
      registryFields.isAllWasteFor.push(bsff.emitterCompanySiret);
    }
    registryFields.isOutgoingWasteFor.push(...bsff.detenteurCompanySirets);
    registryFields.isAllWasteFor.push(...bsff.detenteurCompanySirets);
  }

  for (const transporter of bsff.transporters ?? []) {
    if (transporter.transporterTransportSignatureDate) {
      const transporterCompanyOrgId = getTransporterCompanyOrgId(transporter);
      if (transporterCompanyOrgId) {
        registryFields.isTransportedWasteFor.push(transporterCompanyOrgId);
        registryFields.isAllWasteFor.push(transporterCompanyOrgId);
      }
    }
  }

  if (bsff.destinationReceptionSignatureDate && bsff.destinationCompanySiret) {
    registryFields.isIncomingWasteFor.push(bsff.destinationCompanySiret);
  }

  return registryFields;
}

export const getSubType = (bsff: RegistryBsff): BsdSubType => {
  if (bsff.type === "GROUPEMENT") {
    return "GROUPEMENT";
  } else if (bsff.type === "RECONDITIONNEMENT") {
    return "RECONDITIONNEMENT";
  } else if (bsff.type === "REEXPEDITION") {
    return "RESHIPMENT";
  }

  return "INITIAL";
};

export function toGenericWaste(bsff: RegistryBsff): GenericWaste {
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
    bsdSubType: getSubType(bsff),
    status: bsff.status,
    customId: null,
    destinationOperationNoTraceability: false,
    destinationReceptionAcceptationStatus:
      bsffDestination.receptionAcceptationStatus,
    destinationOperationDate: bsffDestination.operationDate,
    destinationReceptionWeight: bsffDestination.receptionWeight
      ? bsffDestination.receptionWeight / 1000
      : bsffDestination.receptionWeight,
    wasteAdr: bsff.wasteAdr,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    destinationCompanyMail: bsff.destinationCompanyMail
  };
}

export function toIncomingWaste(bsff: RegistryBsff): Required<IncomingWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsff);
  const transporter = getFirstTransporterSync(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyIncomingWaste,
    ...genericWaste,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationReceptionDate: bsff.destinationReceptionDate,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...getOperationData(bsff),
    ...(transporter ? getTransportersData(bsff) : {}),
    ...getInitialEmitterData(bsff)
  };
}

export function toOutgoingWaste(bsff: RegistryBsff): Required<OutgoingWaste> {
  const transporter = getFirstTransporterSync(bsff);

  const { __typename, ...genericWaste } = toGenericWaste(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyOutgoingWaste,
    ...genericWaste,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterPickupsiteAddress: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toNumber()
      : null,
    ...getOperationData(bsff),
    ...getFinalOperationsData(bsff),
    ...(transporter ? getTransportersData(bsff) : {}),
    ...getInitialEmitterData(bsff)
  };
}

export function toTransportedWaste(
  bsff: RegistryBsff
): Required<TransportedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsff);
  const transporter = getFirstTransporterSync(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyTransportedWaste,
    ...genericWaste,
    destinationReceptionDate: bsff.destinationReceptionDate,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toNumber()
      : null,
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
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...(transporter ? getTransportersData(bsff, true) : {})
  };
}

/**
 * BSFF has no trader or broker so this function should not
 * be called. We implement it anyway in case it is added later on
 */
export function toManagedWaste(bsff: RegistryBsff): Required<ManagedWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsff);
  const transporter = getFirstTransporterSync(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyManagedWaste,
    ...genericWaste,
    traderCompanyName: null,
    traderCompanySiret: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...(transporter ? getTransportersData(bsff) : {})
  };
}

export function toAllWaste(bsff: RegistryBsff): Required<AllWaste> {
  const { __typename, ...genericWaste } = toGenericWaste(bsff);
  const transporter = getFirstTransporterSync(bsff);

  return {
    // Make sure all possible keys are in the exported sheet so that no column is missing
    ...emptyAllWaste,
    ...genericWaste,
    createdAt: bsff.createdAt,
    destinationReceptionDate: bsff.destinationReceptionDate,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerRecepisseNumber: null,
    destinationCompanyAddress: bsff.destinationCompanyAddress,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationPlannedOperationMode: null,
    emitterCompanyAddress: bsff.emitterCompanyAddress,
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterPickupsiteAddress: null,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toNumber()
      : null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderRecepisseNumber: null,
    emitterCompanyMail: bsff.emitterCompanyMail,
    ...getOperationData(bsff),
    ...getFinalOperationsData(bsff),
    ...(transporter ? getTransportersData(bsff, true) : {}),
    ...getInitialEmitterData(bsff)
  };
}
