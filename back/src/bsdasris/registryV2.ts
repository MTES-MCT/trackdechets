import { IncomingWasteV2 } from "@td/codegen-back";
import { getTransporterCompanyOrgId } from "@td/constants";
import {
  Bsdasri,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@prisma/client";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { emptyIncomingWasteV2, RegistryV2Bsdasri } from "../registryV2/types";
import { getBsdasriSubType } from "../common/subTypes";
import { getWasteDescription } from "./utils";
import { splitAddress } from "../common/addresses";
import { deleteRegistryLookup, generateDateInfos } from "@td/registry";
import { prisma } from "@td/prisma";

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
    destinationPlannedOperationCode: bsdasri.destinationOperationCode,
    destinationOperationCode: bsdasri.destinationOperationCode,
    destinationOperationMode: bsdasri.destinationOperationMode,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    declarationNumber: null,
    notificationNumber: null,
    movementNumber: null,
    nextOperationCode: null,
    isUpcycled: null
  };
};

export const updateRegistryLookup = async (
  bsdasri: Bsdasri,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (
    bsdasri.destinationReceptionSignatureDate &&
    bsdasri.destinationCompanySiret
  ) {
    await tx.registryLookup.upsert({
      where: {
        idExportTypeAndSiret: {
          id: bsdasri.id,
          exportRegistryType: RegistryExportType.INCOMING,
          siret: bsdasri.destinationCompanySiret
        }
      },
      update: {},
      create: {
        id: bsdasri.id,
        readableId: bsdasri.id,
        siret: bsdasri.destinationCompanySiret,
        exportRegistryType: RegistryExportType.INCOMING,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bsdasri.wasteCode,
        ...generateDateInfos(bsdasri.destinationReceptionSignatureDate),
        bsdasriId: bsdasri.id
      }
    });
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
      }
    });
    for (const bsdasri of items) {
      await prisma.$transaction(async tx => {
        await updateRegistryLookup(bsdasri, tx);
      });
    }
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
