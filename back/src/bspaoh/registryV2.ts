import Decimal from "decimal.js";
import {
  Bspaoh,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { IncomingWasteV2 } from "@td/codegen-back";
import { getTransporterCompanyOrgId } from "@td/constants";
import { getBspaohSubType } from "../common/subTypes";
import { getWasteDescription } from "./utils";
import { splitAddress } from "../common/addresses";
import { getFirstTransporterSync } from "./converter";
import { emptyIncomingWasteV2, RegistryV2Bspaoh } from "../registryV2/types";
import { deleteRegistryLookup, generateDateInfos } from "@td/registry";

export const toIncomingWasteV2 = (
  bspaoh: RegistryV2Bspaoh
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bspaoh.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bspaoh.emitterCompanyAddress);

  const transporter = getFirstTransporterSync(bspaoh);
  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    transporter?.transporterCompanyAddress,
    transporter?.transporterCompanyVatNumber
  );

  return {
    ...emptyIncomingWasteV2,
    id: bspaoh.id,
    source: "BSD",
    publicId: null,
    bsdId: bspaoh.id,
    reportAsSiret: null,
    createdAt: bspaoh.createdAt,
    updatedAt: bspaoh.updatedAt,
    transporterTakenOverAt: bspaoh.transporterTransportTakenOverAt,
    destinationReceptionDate: bspaoh.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bspaoh.destinationOperationDate,
    bsdType: "BSPAOH",
    bsdSubType: getBspaohSubType(bspaoh),
    customId: null,
    status: bspaoh.status,
    wasteDescription: bspaoh.wasteCode
      ? getWasteDescription(bspaoh.wasteType)
      : "",
    wasteCode: bspaoh.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    weight: bspaoh.emitterWasteWeightValue
      ? new Decimal(bspaoh.emitterWasteWeightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bspaoh.emitterWasteWeightValue,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null,
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyCountry: null,
    initialEmitterMunicipalitiesNames: null,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyName: bspaoh.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bspaoh.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterPickupsiteName: bspaoh.emitterPickupSiteName,
    emitterPickupsiteAddress: bspaoh.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bspaoh.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bspaoh.emitterPickupSiteCity,
    emitterPickupsiteCountry: bspaoh.emitterPickupSiteAddress ? "FR" : null,
    emitterCompanyMail: bspaoh.emitterCompanyMail,
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
    ecoOrganismeName: null,
    ecoOrganismeSiret: null,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderCompanyMail: null,
    traderRecepisseNumber: null,
    brokerCompanyName: null,
    brokerCompanySiret: null,
    brokerCompanyMail: null,
    brokerRecepisseNumber: null,
    isDirectSupply: false,
    transporter1CompanyName: transporter?.transporterCompanyName ?? null,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted ?? null,
    transporter1RecepisseNumber:
      transporter?.transporterRecepisseNumber ?? null,
    transporter1TransportMode: transporter?.transporterTransportMode ?? null,
    transporter1CompanyMail: transporter?.transporterCompanyMail ?? null,
    wasteAdr: bspaoh.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanyName: bspaoh.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bspaoh.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bspaoh.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bspaoh.destinationReceptionAcceptationStatus,
    destinationReceptionWeight:
      bspaoh.destinationReceptionWasteReceivedWeightValue
        ? new Decimal(bspaoh.destinationReceptionWasteReceivedWeightValue)
            .dividedBy(1000)
            .toDecimalPlaces(6)
            .toNumber()
        : bspaoh.destinationReceptionWasteReceivedWeightValue,
    destinationReceptionRefusedWeight:
      bspaoh.destinationReceptionWasteRefusedWeightValue
        ? new Decimal(bspaoh.destinationReceptionWasteRefusedWeightValue)
            .dividedBy(1000)
            .toDecimalPlaces(6)
            .toNumber()
        : bspaoh.destinationReceptionWasteRefusedWeightValue,
    destinationReceptionAcceptedWeight:
      bspaoh.destinationReceptionWasteAcceptedWeightValue
        ? new Decimal(bspaoh.destinationReceptionWasteAcceptedWeightValue)
            .dividedBy(1000)
            .toDecimalPlaces(6)
            .toNumber()
        : bspaoh.destinationReceptionWasteAcceptedWeightValue,
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionVolume: null,
    destinationPlannedOperationCode: bspaoh.destinationOperationCode,
    destinationOperationCode: bspaoh.destinationOperationCode,
    destinationOperationMode: "ELIMINATION",
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false
  };
};

const performRegistryLookupUpdate = async (
  bspaoh: Bspaoh,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await deleteRegistryLookup(bspaoh.id, tx);
  if (
    bspaoh.destinationReceptionSignatureDate &&
    bspaoh.destinationCompanySiret
  ) {
    await tx.registryLookup.create({
      data: {
        id: bspaoh.id,
        readableId: bspaoh.id,
        siret: bspaoh.destinationCompanySiret,
        exportRegistryType: RegistryExportType.INCOMING,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bspaoh.wasteCode,
        ...generateDateInfos(bspaoh.destinationReceptionSignatureDate),
        bspaohId: bspaoh.id
      },
      select: { id: true }
    });
  }
};

export const updateRegistryLookup = async (
  bspaoh: Bspaoh,
  tx?: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (!tx) {
    await prisma.$transaction(async transaction => {
      await performRegistryLookupUpdate(bspaoh, transaction);
    });
  } else {
    await performRegistryLookupUpdate(bspaoh, tx);
  }
};

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      bspaohId: { not: null }
    }
  });
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.bspaoh.findMany({
      where: {
        isDeleted: false,
        NOT: {
          status: "DRAFT"
        }
      },
      take: 100,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: {
        id: "desc"
      }
    });
    for (const bspaoh of items) {
      await prisma.$transaction(async tx => {
        await updateRegistryLookup(bspaoh, tx);
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
