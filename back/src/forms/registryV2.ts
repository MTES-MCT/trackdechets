import { IncomingWasteV2 } from "@td/codegen-back";
import {
  PrismaClient,
  RegistryExportType,
  RegistryExportDeclarationType,
  RegistryExportWasteType,
  Form
} from "@prisma/client";
import { emptyIncomingWasteV2, RegistryV2Bsdd } from "../registryV2/types";
import { formToBsdd } from "./compat";
import { getBsddSubType } from "../common/subTypes";
import { splitAddress } from "../common/addresses";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { deleteRegistryLookup, generateDateInfos } from "@td/registry";
import { prisma } from "@td/prisma";

const getInitialEmitterData = (bsdd: ReturnType<typeof formToBsdd>) => {
  const initialEmitter: Record<string, string | null> = {
    initialEmitterCompanyAddress: null,
    initialEmitterCompanyCity: null,
    initialEmitterCompanyPostalCode: null,
    initialEmitterCompanyCountry: null,
    initialEmitterCompanyName: null,
    initialEmitterCompanySiret: null
  };

  // Bsd suite. Fill initial emitter data.
  if (bsdd.forwarding) {
    const { street, city, postalCode, country } = splitAddress(
      bsdd.forwarding.emitterCompanyAddress
    );
    initialEmitter.initialEmitterCompanyAddress = street;
    initialEmitter.initialEmitterCompanyCity = city;
    initialEmitter.initialEmitterCompanyPostalCode = postalCode;
    initialEmitter.initialEmitterCompanyCountry = country;

    initialEmitter.initialEmitterCompanyName =
      bsdd.forwarding.emitterCompanyName;
    initialEmitter.initialEmitterCompanySiret =
      bsdd.forwarding.emitterCompanySiret;
  }

  return initialEmitter;
};

export const toIncomingWasteV2 = (
  form: RegistryV2Bsdd
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const bsdd = formToBsdd(form);

  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsdd);
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bsdd.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsdd.emitterCompanyAddress);

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsdd.transporterCompanyAddress,
    bsdd.transporterCompanyVatNumber
  );

  const {
    street: transporter2CompanyAddress,
    postalCode: transporter2CompanyPostalCode,
    city: transporter2CompanyCity,
    country: transporter2CompanyCountry
  } = splitAddress(
    bsdd.transporter2CompanyAddress,
    bsdd.transporter2CompanyVatNumber
  );

  const {
    street: transporter3CompanyAddress,
    postalCode: transporter3CompanyPostalCode,
    city: transporter3CompanyCity,
    country: transporter3CompanyCountry
  } = splitAddress(
    bsdd.transporter3CompanyAddress,
    bsdd.transporter3CompanyVatNumber
  );

  const {
    street: transporter4CompanyAddress,
    postalCode: transporter4CompanyPostalCode,
    city: transporter4CompanyCity,
    country: transporter4CompanyCountry
  } = splitAddress(
    bsdd.transporter4CompanyAddress,
    bsdd.transporter4CompanyVatNumber
  );

  const {
    street: transporter5CompanyAddress,
    postalCode: transporter5CompanyPostalCode,
    city: transporter5CompanyCity,
    country: transporter5CompanyCountry
  } = splitAddress(
    bsdd.transporter5CompanyAddress,
    bsdd.transporter5CompanyVatNumber
  );

  return {
    ...emptyIncomingWasteV2,
    id: bsdd.id,
    source: "BSD",
    publicId: null,
    bsdId: bsdd.id,
    reportAsSiret: null,
    createdAt: bsdd.createdAt,
    updatedAt: bsdd.updatedAt,
    transporterTakenOverAt: bsdd.transporterTransportTakenOverAt,
    destinationReceptionDate: bsdd.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bsdd.destinationOperationDate,
    bsdType: "BSDD",
    bsdSubType: getBsddSubType(bsdd),
    customId: bsdd.customId,
    status: bsdd.status,
    wasteDescription: bsdd.wasteDescription,
    wasteCode: bsdd.wasteCode,
    wasteCodeBale: null,
    wastePop: bsdd.pop,
    wasteIsDangerous: bsdd.wasteIsDangerous,
    weight: bsdd.weightValue,
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry,
    initialEmitterMunicipalitiesNames: null,
    initialEmitterMunicipalitiesInseeCodes: null,
    emitterCompanyIrregularSituation: null,
    emitterCompanyName: bsdd.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsdd.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterPickupsiteName: bsdd.emitterPickupSiteName,
    emitterPickupsiteAddress: bsdd.emitterPickupSiteAddress,
    emitterPickupsitePostalCode: bsdd.emitterPickupSitePostalCode,
    emitterPickupsiteCity: bsdd.emitterPickupSiteCity,
    emitterPickupsiteCountry: bsdd.emitterPickupSiteAddress ? "FR" : null,
    emitterCompanyMail: bsdd.emitterCompanyMail,
    workerCompanyName: null,
    workerCompanySiret: null,
    workerCompanyAddress: null,
    workerCompanyPostalCode: null,
    workerCompanyCity: null,
    workerCompanyCountry: null,
    parcelCities: bsdd.parcelCities,
    parcelInseeCodes: bsdd.parcelPostalCodes,
    parcelNumbers: bsdd.parcelNumbers,
    parcelCoordinates: bsdd.parcelCoordinates,
    sisIdentifier: null,
    ecoOrganismeName: bsdd.ecoOrganismeName,
    ecoOrganismeSiret: bsdd.ecoOrganismeSiret,
    traderCompanyName: bsdd.traderCompanyName,
    traderCompanySiret: bsdd.traderCompanySiret,
    traderCompanyMail: bsdd.traderCompanyMail,
    traderRecepisseNumber: bsdd.traderRecepisseNumber,
    brokerCompanyName: bsdd.brokerCompanyName,
    brokerCompanySiret: bsdd.brokerCompanySiret,
    brokerCompanyMail: bsdd.brokerCompanyMail,
    brokerRecepisseNumber: bsdd.brokerRecepisseNumber,
    transporter1CompanyName: bsdd.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: bsdd.transporterCompanySiret?.length
      ? bsdd.transporterCompanySiret
      : bsdd.transporterCompanyVatNumber,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsdd.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsdd.transporterRecepisseNumber,
    transporter1TransportMode: bsdd.transporterTransportMode,
    transporter1CompanyMail: bsdd.transporterCompanyMail,
    wasteAdr: bsdd.wasteAdr,
    nonRoadRegulationMention: bsdd.nonRoadRegulationMention,
    destinationCap: bsdd.destinationCap,
    wasteDap: null,
    destinationCompanyName: bsdd.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsdd.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsdd.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bsdd.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsdd.destinationReceptionWeight,
    destinationReceptionRefusedWeight: bsdd.destinationReceptionRefusedWeight,
    destinationReceptionAcceptedWeight: bsdd.destinationReceptionAcceptedWeight,
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionVolume: null,
    destinationPlannedOperationCode: bsdd.destinationPlannedOperationCode,
    destinationOperationCode: bsdd.destinationOperationCode,
    destinationOperationMode: bsdd.destinationOperationMode,
    destinationHasCiterneBeenWashedOut: bsdd.destinationHasCiterneBeenWashedOut,
    destinationOperationNoTraceability: bsdd.destinationOperationNoTraceability,
    declarationNumber: null,
    notificationNumber: bsdd.nextDestinationNotificationNumber,
    movementNumber: null,
    nextOperationCode: bsdd.nextDestinationProcessingOperation,
    isUpcycled: null,
    destinationParcelInseeCodes: null,
    destinationParcelNumbers: null,
    destinationParcelCoordinates: null,
    transporter2CompanyName: bsdd.transporter2CompanyName ?? null,
    transporter2CompanyGivenName: null,
    transporter2CompanySiret:
      (bsdd.transporter2CompanySiret?.length
        ? bsdd.transporter2CompanySiret
        : bsdd.transporter2CompanyVatNumber) ?? null,
    transporter2CompanyAddress,
    transporter2CompanyPostalCode,
    transporter2CompanyCity,
    transporter2CompanyCountry,
    transporter2RecepisseIsExempted:
      bsdd.transporter2RecepisseIsExempted ?? null,
    transporter2RecepisseNumber: bsdd.transporter2RecepisseNumber ?? null,
    transporter2TransportMode: bsdd.transporter2TransportMode ?? null,
    transporter2CompanyMail: bsdd.transporter2CompanyMail ?? null,
    transporter3CompanyName: bsdd.transporter3CompanyName ?? null,
    transporter3CompanyGivenName: null,
    transporter3CompanySiret:
      (bsdd.transporter3CompanySiret?.length
        ? bsdd.transporter3CompanySiret
        : bsdd.transporter3CompanyVatNumber) ?? null,
    transporter3CompanyAddress,
    transporter3CompanyPostalCode,
    transporter3CompanyCity,
    transporter3CompanyCountry,
    transporter3RecepisseIsExempted:
      bsdd.transporter3RecepisseIsExempted ?? null,
    transporter3RecepisseNumber: bsdd.transporter3RecepisseNumber ?? null,
    transporter3TransportMode: bsdd.transporter3TransportMode ?? null,
    transporter3CompanyMail: bsdd.transporter3CompanyMail ?? null,
    transporter4CompanyName: bsdd.transporter4CompanyName ?? null,
    transporter4CompanyGivenName: null,
    transporter4CompanySiret:
      (bsdd.transporter4CompanySiret?.length
        ? bsdd.transporter4CompanySiret
        : bsdd.transporter4CompanyVatNumber) ?? null,
    transporter4CompanyAddress,
    transporter4CompanyPostalCode,
    transporter4CompanyCity,
    transporter4CompanyCountry,
    transporter4RecepisseIsExempted:
      bsdd.transporter4RecepisseIsExempted ?? null,
    transporter4RecepisseNumber: bsdd.transporter4RecepisseNumber ?? null,
    transporter4TransportMode: bsdd.transporter4TransportMode ?? null,
    transporter4CompanyMail: bsdd.transporter4CompanyMail ?? null,
    transporter5CompanyName: bsdd.transporter5CompanyName ?? null,
    transporter5CompanyGivenName: null,
    transporter5CompanySiret:
      (bsdd.transporter5CompanySiret?.length
        ? bsdd.transporter5CompanySiret
        : bsdd.transporter5CompanyVatNumber) ?? null,
    transporter5CompanyAddress,
    transporter5CompanyPostalCode,
    transporter5CompanyCity,
    transporter5CompanyCountry,
    transporter5RecepisseIsExempted:
      bsdd.transporter5RecepisseIsExempted ?? null,
    transporter5RecepisseNumber: bsdd.transporter5RecepisseNumber ?? null,
    transporter5TransportMode: bsdd.transporter5TransportMode ?? null,
    transporter5CompanyMail: bsdd.transporter5CompanyMail ?? null
  };
};

export const updateRegistryLookup = async (
  form: Form,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (form.receivedAt && form.recipientCompanySiret) {
    await tx.registryLookup.upsert({
      where: {
        id_exportRegistryType_siret: {
          id: form.id,
          exportRegistryType: RegistryExportType.INCOMING,
          siret: form.recipientCompanySiret
        }
      },
      update: {},
      create: {
        id: form.id,
        readableId: form.readableId,
        siret: form.recipientCompanySiret,
        exportRegistryType: RegistryExportType.INCOMING,
        declarationType: RegistryExportDeclarationType.BSD,
        wasteType: form.wasteDetailsIsDangerous
          ? RegistryExportWasteType.DD
          : RegistryExportWasteType.DND,
        wasteCode: form.wasteDetailsCode,
        ...generateDateInfos(form.receivedAt),
        bsddId: form.id
      }
    });
  }
};

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      bsddId: { not: null }
    }
  });

  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.form.findMany({
      where: {
        isDeleted: false
      },
      take: 100,
      skip: cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy: {
        id: "desc"
      }
    });
    for (const bsdd of items) {
      await prisma.$transaction(async tx => {
        await updateRegistryLookup(bsdd, tx);
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
