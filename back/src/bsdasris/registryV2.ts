import { IncomingWasteV2, OutgoingWasteV2 } from "@td/codegen-back";
import { getTransporterCompanyOrgId } from "@td/constants";
import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@prisma/client";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import {
  emptyIncomingWasteV2,
  emptyOutgoingWasteV2,
  RegistryV2Bsdasri
} from "../registryV2/types";
import { getBsdasriSubType } from "../common/subTypes";
import { getWasteDescription } from "./utils";
import { splitAddress } from "../common/addresses";
import { deleteRegistryLookup, generateDateInfos } from "@td/registry";
import { prisma } from "@td/prisma";
import { isFinalOperationCode } from "../common/operationCodes";

const getFinalOperationsData = (bsdasri: RegistryV2Bsdasri) => {
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

export const toIncomingWasteV2 = (
  bsdasri: RegistryV2Bsdasri
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bsdasri.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsdasri.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsdasri.transporterCompanyAddress,
    bsdasri.transporterCompanyVatNumber
  );

  return {
    ...emptyIncomingWasteV2,
    id: bsdasri.id,
    source: "BSD",
    publicId: null,
    bsdId: bsdasri.id,
    reportAsSiret: null,
    createdAt: bsdasri.createdAt,
    updatedAt: bsdasri.updatedAt,
    transporterTakenOverAt: bsdasri.transporterTakenOverAt,
    destinationReceptionDate: bsdasri.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bsdasri.destinationOperationDate,
    bsdType: "BSDASRI",
    bsdSubType: getBsdasriSubType(bsdasri),
    customId: null,
    status: bsdasri.status,
    wasteDescription: bsdasri.wasteCode
      ? getWasteDescription(bsdasri.wasteCode)
      : "",
    wasteCode: bsdasri.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterMunicipalitiesNames: null,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterPickupsiteName: bsdasri.emitterPickupSiteName,
    emitterPickupsiteAddress: bsdasri.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsdasri.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsdasri.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsdasri.emitterPickupSiteAddress ? "FR" : null,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    ecoOrganismeSiret: bsdasri.ecoOrganismeSiret,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderCompanyMail: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerCompanyMail: null,
    brokerRecepisseNumber: null,
    isDirectSupply: false,
    transporter1CompanyName: bsdasri.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: getTransporterCompanyOrgId(bsdasri),
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsdasri.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsdasri.transporterRecepisseNumber,
    transporter1TransportMode: bsdasri.transporterTransportMode,
    transporter1CompanyMail: bsdasri.transporterCompanyMail,
    wasteAdr: bsdasri.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsdasri.destinationReceptionWasteWeightValue
      ? bsdasri.destinationReceptionWasteWeightValue
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : null,
    destinationReceptionRefusedWeight:
      bsdasri.destinationReceptionWasteRefusedWeightValue
        ? bsdasri.destinationReceptionWasteRefusedWeightValue
            .dividedBy(1000)
            .toDecimalPlaces(6)
            .toNumber()
        : null,
    destinationReceptionAcceptedWeight:
      bsdasri.destinationReceptionWasteWeightValue
        ? bsdasri.destinationReceptionWasteRefusedWeightValue
          ? bsdasri.destinationReceptionWasteWeightValue
              .minus(bsdasri.destinationReceptionWasteRefusedWeightValue)
              .dividedBy(1000)
              .toDecimalPlaces(6)
              .toNumber()
          : bsdasri.destinationReceptionWasteWeightValue
              .dividedBy(1000)
              .toDecimalPlaces(6)
              .toNumber()
        : null,
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionVolume: null,
    destinationPlannedOperationCode: null,
    destinationOperationCodes: bsdasri.destinationOperationCode
      ? [bsdasri.destinationOperationCode]
      : null,
    destinationOperationModes: bsdasri.destinationOperationMode
      ? [bsdasri.destinationOperationMode]
      : null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    declarationNumber: null,
    notificationNumber: null,
    movementNumber: null,
    nextOperationCode: null,
    isUpcycled: null
  };
};

export const toOutgoingWasteV2 = (
  bsdasri: RegistryV2Bsdasri
): Omit<Required<OutgoingWasteV2>, "__typename"> => {
  const {
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    destinationFinalOperationCompanySirets
  } = getFinalOperationsData(bsdasri);

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

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsdasri.transporterCompanyAddress,
    bsdasri.transporterCompanyVatNumber
  );

  return {
    ...emptyOutgoingWasteV2,
    id: bsdasri.id,
    source: "BSD",
    publicId: null,
    bsdId: bsdasri.id,
    reportAsSiret: null,
    createdAt: bsdasri.createdAt,
    updatedAt: bsdasri.updatedAt,
    transporterTakenOverAt: bsdasri.transporterTakenOverAt,
    destinationOperationDate: bsdasri.destinationOperationDate,
    bsdType: "BSDASRI",
    bsdSubType: getBsdasriSubType(bsdasri),
    customId: null,
    status: bsdasri.status,
    wasteDescription: bsdasri.wasteCode
      ? getWasteDescription(bsdasri.wasteCode)
      : "",
    wasteCode: bsdasri.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    weight: bsdasri.emitterWasteWeightValue
      ? bsdasri.emitterWasteWeightValue
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : null,
    weightIsEstimate: bsdasri.emitterWasteWeightIsEstimate,
    volume: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterMunicipalitiesNames: null,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanySiret: bsdasri.emitterCompanySiret,
    emitterCompanyName: bsdasri.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsdasri.emitterCompanyMail,
    emitterPickupsiteName: bsdasri.emitterPickupSiteName,
    emitterPickupsiteAddress: bsdasri.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsdasri.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsdasri.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsdasri.emitterPickupSiteAddress ? "FR" : null,
    workerCompanySiret: null,
    workerCompanyName: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeSiret: bsdasri.ecoOrganismeSiret,
    ecoOrganismeName: bsdasri.ecoOrganismeName,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderCompanyMail: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerCompanyMail: null,
    brokerRecepisseNumber: null,
    isDirectSupply: false,
    transporter1CompanySiret: getTransporterCompanyOrgId(bsdasri),
    transporter1CompanyName: bsdasri.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsdasri.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsdasri.transporterRecepisseNumber,
    transporter1TransportMode: bsdasri.transporterTransportMode,
    transporter1CompanyMail: bsdasri.transporterCompanyMail,
    wasteAdr: bsdasri.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanySiret: bsdasri.destinationCompanySiret,
    destinationCompanyName: bsdasri.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyCountry,
    destinationCompanyMail: bsdasri.destinationCompanyMail,
    destinationDropSiteAddress: null,
    destinationDropSitePostalCode: null,
    destinationDropSiteCity: null,
    destinationDropSiteCountryCode: null,
    postTempStorageDestinationSiret: null,
    postTempStorageDestinationName: null,
    postTempStorageDestinationAddress: null,
    postTempStorageDestinationPostalCode: null,
    postTempStorageDestinationCity: null,
    postTempStorageDestinationCountry: null,

    destinationReceptionAcceptationStatus:
      bsdasri.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsdasri.destinationReceptionWasteWeightValue
      ? bsdasri.destinationReceptionWasteWeightValue
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : null,
    destinationReceptionAcceptedWeight:
      bsdasri.destinationReceptionWasteWeightValue
        ? bsdasri.destinationReceptionWasteRefusedWeightValue
          ? bsdasri.destinationReceptionWasteWeightValue
              .minus(bsdasri.destinationReceptionWasteRefusedWeightValue)
              .dividedBy(1000)
              .toDecimalPlaces(6)
              .toNumber()
          : bsdasri.destinationReceptionWasteWeightValue
              .dividedBy(1000)
              .toDecimalPlaces(6)
              .toNumber()
        : null,
    destinationReceptionRefusedWeight:
      bsdasri.destinationReceptionWasteRefusedWeightValue
        ? bsdasri.destinationReceptionWasteRefusedWeightValue
            .dividedBy(1000)
            .toDecimalPlaces(6)
            .toNumber()
        : null,
    destinationPlannedOperationCode: null,
    destinationPlannedOperationMode: null,
    destinationOperationCodes: bsdasri.destinationOperationCode
      ? [bsdasri.destinationOperationCode]
      : null,
    destinationOperationModes: bsdasri.destinationOperationMode
      ? [bsdasri.destinationOperationMode]
      : null,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    destinationFinalOperationCompanySirets,
    nextDestinationPlannedOperationCodes: null,
    destinationFinalOperationCodes,
    destinationFinalOperationWeights,
    declarationNumber: null,
    notificationNumber: null,
    movementNumber: null,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null
  };
};

const minimalBsdasriForLookupSelect = {
  id: true,
  destinationReceptionSignatureDate: true,
  destinationCompanySiret: true,
  transporterTransportSignatureDate: true,
  emitterCompanySiret: true,
  ecoOrganismeSiret: true,
  wasteCode: true
};

type MinimalBsdasriForLookup = Prisma.BsdasriGetPayload<{
  select: typeof minimalBsdasriForLookupSelect;
}>;

const bsdasriToLookupCreateInputs = (
  bsdasri: MinimalBsdasriForLookup
): Prisma.RegistryLookupUncheckedCreateInput[] => {
  const res: Prisma.RegistryLookupUncheckedCreateInput[] = [];
  if (
    bsdasri.destinationReceptionSignatureDate &&
    bsdasri.destinationCompanySiret
  ) {
    res.push({
      id: bsdasri.id,
      readableId: bsdasri.id,
      siret: bsdasri.destinationCompanySiret,
      exportRegistryType: RegistryExportType.INCOMING,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bsdasri.wasteCode,
      ...generateDateInfos(bsdasri.destinationReceptionSignatureDate),
      bsdasriId: bsdasri.id
    });
  }
  if (bsdasri.transporterTransportSignatureDate) {
    const sirets = new Set([
      bsdasri.emitterCompanySiret,
      bsdasri.ecoOrganismeSiret
    ]);
    sirets.forEach(siret => {
      if (!siret) {
        return;
      }
      res.push({
        id: bsdasri.id,
        readableId: bsdasri.id,
        siret,
        exportRegistryType: RegistryExportType.OUTGOING,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bsdasri.wasteCode,
        ...generateDateInfos(bsdasri.transporterTransportSignatureDate!),
        bsdasriId: bsdasri.id
      });
    });
  }
  return res;
};

const performRegistryLookupUpdate = async (
  bsdasri: MinimalBsdasriForLookup,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await deleteRegistryLookup(bsdasri.id, tx);
  const lookupInputs = bsdasriToLookupCreateInputs(bsdasri);
  if (lookupInputs.length > 0) {
    await tx.registryLookup.createMany({
      data: lookupInputs
    });
  }
};

export const updateRegistryLookup = async (
  bsdasri: MinimalBsdasriForLookup,
  tx?: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (!tx) {
    await prisma.$transaction(async transaction => {
      await performRegistryLookupUpdate(bsdasri, transaction);
    });
  } else {
    await performRegistryLookupUpdate(bsdasri, tx);
  }
};

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      bsdasriId: { not: null }
    }
  });
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.bsdasri.findMany({
      where: {
        isDeleted: false,
        isDraft: false
      },
      take: 100,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: {
        id: "desc"
      },
      select: minimalBsdasriForLookupSelect
    });
    let createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
    for (const bsdasri of items) {
      const createInputs = bsdasriToLookupCreateInputs(bsdasri);
      createArray = createArray.concat(createInputs);
    }
    await prisma.registryLookup.createMany({
      data: createArray
    });
    if (items.length < 100) {
      done = true;
      return;
    }
    cursorId = items[items.length - 1].id;
  }
};

export const lookupUtils = {
  update: updateRegistryLookup,
  delete: deleteRegistryLookup,
  rebuildLookup: rebuildRegistryLookup
};
