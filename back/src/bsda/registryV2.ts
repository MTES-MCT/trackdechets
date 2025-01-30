import { IncomingWasteV2 } from "@td/codegen-back";
import {
  PrismaClient,
  Bsda,
  RegistryExportType,
  RegistryExportDeclarationType,
  RegistryExportWasteType
} from "@prisma/client";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { getTransporterCompanyOrgId } from "@td/constants";
import { emptyIncomingWasteV2, RegistryV2Bsda } from "../registryV2/types";
import { splitAddress } from "../common/addresses";
import { getTransportersSync } from "./database";
import { getBsdaSubType } from "../common/subTypes";
import { deleteRegistryLookup, generateDateInfos } from "@td/registry";
import { prisma } from "@td/prisma";

const getInitialEmitterData = (bsda: RegistryV2Bsda) => {
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

export const toIncomingWasteV2 = (
  bsda: RegistryV2Bsda
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsda);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsda);
  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    transporter?.transporterCompanyAddress,
    transporter?.transporterCompanyVatNumber
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

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bsda.destinationCompanyAddress);

  const {
    street: workerCompanyAddress,
    postalCode: workerCompanyPostalCode,
    city: workerCompanyCity,
    country: workerCompanyCountry
  } = splitAddress(bsda.workerCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsda.emitterCompanyAddress);

  return {
    ...emptyIncomingWasteV2,
    id: bsda.id,
    source: "BSD",
    publicId: null,
    bsdId: bsda.id,
    reportAsSiret: null,
    createdAt: bsda.createdAt,
    updatedAt: bsda.updatedAt,
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    destinationReceptionDate: bsda.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bsda.destinationOperationDate,
    bsdType: "BSDA",
    bsdSubType: getBsdaSubType(bsda),
    customId: null,
    status: bsda.status,
    wasteDescription: bsda.wasteMaterialName,
    wasteCode: bsda.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    weight: bsda.weightValue
      ? bsda.weightValue.dividedBy(1000).toDecimalPlaces(6).toNumber()
      : null,
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    initialEmitterMunicipalitiesNames: null,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyName: bsda.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsda.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterPickupsiteName: bsda.emitterPickupSiteName,
    emitterPickupsiteAddress: bsda.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsda.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsda.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsda.emitterPickupSiteAddress ? "FR" : null,
    emitterCompanyMail: bsda.emitterCompanyMail,
    workerCompanyName: bsda.workerCompanyName,
    workerCompanySiret: bsda.workerCompanySiret,
    workerCompanyAddress,
    workerCompanyPostalCode,
    workerCompanyCity,
    workerCompanyCountry,
    parcelCities: null,
    parcelInseeCodes: null,
    parcelNumbers: null,
    parcelCoordinates: null,
    sisIdentifiers: null,
    ecoOrganismeName: bsda.ecoOrganismeName,
    ecoOrganismeSiret: bsda.ecoOrganismeSiret,
    traderCompanyName: null,
    traderCompanySiret: null,
    traderCompanyMail: null,
    traderRecepisseNumber: null,
    brokerCompanyName: bsda.brokerCompanyName,
    brokerCompanySiret: bsda.brokerCompanySiret,
    brokerCompanyMail: bsda.brokerCompanyMail,
    brokerRecepisseNumber: bsda.brokerRecepisseNumber,
    isDirectSupply: false,
    transporter1CompanyName: transporter?.transporterCompanyName ?? null,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: getTransporterCompanyOrgId(transporter),
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted:
      transporter?.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: transporter?.transporterRecepisseNumber,
    transporter1TransportMode: transporter?.transporterTransportMode,
    transporter1CompanyMail: transporter?.transporterCompanyMail,
    wasteAdr: bsda.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanyName: bsda.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsda.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsda.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bsda.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsda.destinationReceptionWeight
      ? bsda.destinationReceptionWeight
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : null,
    destinationReceptionRefusedWeight: null,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionVolume: null,
    destinationPlannedOperationCode: bsda.destinationPlannedOperationCode,
    destinationOperationCode: bsda.destinationOperationCode,
    destinationOperationMode: bsda.destinationOperationMode,
    destinationHasCiterneBeenWashedOut: null,
    destinationOperationNoTraceability: false,
    declarationNumber: null,
    notificationNumber: null,
    movementNumber: null,
    nextOperationCode:
      bsda.destinationOperationNextDestinationPlannedOperationCode,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null,
    transporter2CompanyName: transporter2?.transporterCompanyName,
    transporter2CompanyGivenName: null,
    transporter2CompanySiret: getTransporterCompanyOrgId(transporter2),
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      transporter2?.transporterRecepisseIsExempted,
    transporter2RecepisseNumber: transporter2?.transporterRecepisseNumber,
    transporter2TransportMode: transporter2?.transporterTransportMode,
    transporter2CompanyMail: transporter2?.transporterCompanyMail,
    transporter3CompanyName: transporter3?.transporterCompanyName,
    transporter3CompanyGivenName: null,
    transporter3CompanySiret: getTransporterCompanyOrgId(transporter3),
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      transporter3?.transporterRecepisseIsExempted,
    transporter3RecepisseNumber: transporter3?.transporterRecepisseNumber,
    transporter3TransportMode: transporter3?.transporterTransportMode,
    transporter3CompanyMail: transporter3?.transporterCompanyMail,
    transporter4CompanyName: transporter4?.transporterCompanyName,
    transporter4CompanyGivenName: null,
    transporter4CompanySiret: getTransporterCompanyOrgId(transporter4),
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      transporter4?.transporterRecepisseIsExempted,
    transporter4RecepisseNumber: transporter4?.transporterRecepisseNumber,
    transporter4TransportMode: transporter4?.transporterTransportMode,
    transporter4CompanyMail: transporter4?.transporterCompanyMail,
    transporter5CompanyName: transporter5?.transporterCompanyName,
    transporter5CompanyGivenName: null,
    transporter5CompanySiret: getTransporterCompanyOrgId(transporter5),
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      transporter5?.transporterRecepisseIsExempted,
    transporter5RecepisseNumber: transporter5?.transporterRecepisseNumber,
    transporter5TransportMode: transporter5?.transporterTransportMode,
    transporter5CompanyMail: transporter5?.transporterCompanyMail
  };
};

const performRegistryLookupUpdate = async (
  bsda: Bsda,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await deleteRegistryLookup(bsda.id, tx);
  if (bsda.destinationOperationSignatureDate && bsda.destinationCompanySiret) {
    await tx.registryLookup.create({
      data: {
        id: bsda.id,
        readableId: bsda.id,
        siret: bsda.destinationCompanySiret,
        exportRegistryType: RegistryExportType.INCOMING,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: RegistryExportWasteType.DD,
        wasteCode: bsda.wasteCode,
        ...generateDateInfos(bsda.destinationOperationSignatureDate),
        bsdaId: bsda.id
      },
      select: { id: true }
    });
  }
};

export const updateRegistryLookup = async (
  bsda: Bsda,
  tx?: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (!tx) {
    await prisma.$transaction(async transaction => {
      await performRegistryLookupUpdate(bsda, transaction);
    });
  } else {
    await performRegistryLookupUpdate(bsda, tx);
  }
};

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      bsdaId: { not: null }
    }
  });
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.bsda.findMany({
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
    for (const bsda of items) {
      await prisma.$transaction(async tx => {
        await updateRegistryLookup(bsda, tx);
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
