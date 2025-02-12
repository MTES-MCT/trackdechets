import { IncomingWasteV2 } from "@td/codegen-back";
import Decimal from "decimal.js";
import {
  BsffType,
  OperationMode,
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import { getTransporterCompanyOrgId } from "@td/constants";
import { emptyIncomingWasteV2, RegistryV2Bsff } from "../registryV2/types";
import { getTransportersSync } from "./database";
import { splitAddress } from "../common/addresses";
import { toBsffDestination } from "./compat";
import { getBsffSubType } from "../common/subTypes";
import { deleteRegistryLookup, generateDateInfos } from "@td/registry";

const getInitialEmitterData = (bsff: RegistryV2Bsff) => {
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

export const toIncomingWasteV2 = (
  bsff: RegistryV2Bsff
): Omit<Required<IncomingWasteV2>, "__typename"> => {
  const transporters = getTransportersSync(bsff);

  const [transporter, transporter2, transporter3, transporter4, transporter5] =
    transporters;
  const {
    initialEmitterCompanyName,
    initialEmitterCompanySiret,
    initialEmitterCompanyAddress,
    initialEmitterCompanyPostalCode,
    initialEmitterCompanyCity,
    initialEmitterCompanyCountry
  } = getInitialEmitterData(bsff);
  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
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

  const bsffDestination = toBsffDestination(bsff.packagings);

  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bsff.destinationCompanyAddress);

  const {
    street: emitterCompanyAddress,
    postalCode: emitterCompanyPostalCode,
    city: emitterCompanyCity,
    country: emitterCompanyCountry
  } = splitAddress(bsff.emitterCompanyAddress);

  return {
    ...emptyIncomingWasteV2,
    id: bsff.id,
    source: "BSD",
    publicId: null,
    bsdId: bsff.id,
    reportAsSiret: null,
    createdAt: bsff.createdAt,
    updatedAt: bsff.updatedAt,
    transporterTakenOverAt: transporter?.transporterTransportTakenOverAt,
    destinationReceptionDate: bsff.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bsffDestination.operationDate,
    bsdType: "BSFF",
    bsdSubType: getBsffSubType(bsff),
    customId: null,
    status: bsff.status,
    wasteDescription: bsff.wasteDescription,
    wasteCode: bsff.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    weight: bsff.weightValue
      ? bsff.weightValue.dividedBy(1000).toDecimalPlaces(6).toNumber()
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
    emitterCompanyName: bsff.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsff.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsff.emitterCompanyMail,
    isDirectSupply: false,
    transporter1CompanyName: transporter?.transporterCompanyName,
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
    wasteAdr: bsff.wasteAdr,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanyName: bsff.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsff.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsff.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bsffDestination.receptionAcceptationStatus,
    destinationReceptionWeight: bsffDestination.receptionWeight
      ? new Decimal(bsffDestination.receptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsffDestination.receptionWeight,
    destinationReceptionRefusedWeight: null,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionWeightIsEstimate: false,
    destinationReceptionVolume: null,
    destinationPlannedOperationCode: bsff.destinationPlannedOperationCode,
    destinationOperationCode: bsffDestination.operationCode,
    destinationOperationMode: bsffDestination.operationMode as OperationMode,
    destinationOperationNoTraceability: false,
    declarationNumber: null,
    notificationNumber: null,
    movementNumber: null,
    nextOperationCode: null,
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
    transporter2TransportMode: null,
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

const minimalBsffForLookupSelect = {
  id: true,
  destinationReceptionSignatureDate: true,
  destinationCompanySiret: true,
  wasteCode: true
};

type MinimalBsffForLookup = Prisma.BsffGetPayload<{
  select: typeof minimalBsffForLookupSelect;
}>;

const bsffToLookupCreateInputs = (
  bsff: MinimalBsffForLookup
): { incoming: Prisma.RegistryLookupUncheckedCreateInput | null } => {
  const res: { incoming: Prisma.RegistryLookupUncheckedCreateInput | null } = {
    incoming: null
  };
  if (bsff.destinationReceptionSignatureDate && bsff.destinationCompanySiret) {
    res.incoming = {
      id: bsff.id,
      readableId: bsff.id,
      siret: bsff.destinationCompanySiret,
      exportRegistryType: RegistryExportType.INCOMING,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bsff.wasteCode,
      ...generateDateInfos(bsff.destinationReceptionSignatureDate),
      bsffId: bsff.id
    };
  }
  return res;
};

const performRegistryLookupUpdate = async (
  bsff: MinimalBsffForLookup,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await deleteRegistryLookup(bsff.id, tx);
  const lookupInputs = bsffToLookupCreateInputs(bsff);
  if (lookupInputs.incoming) {
    await tx.registryLookup.create({
      data: lookupInputs.incoming,
      select: { id: true }
    });
  }
};

export const updateRegistryLookup = async (
  bsff: MinimalBsffForLookup,
  tx?: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (!tx) {
    await prisma.$transaction(async transaction => {
      await performRegistryLookupUpdate(bsff, transaction);
    });
  } else {
    await performRegistryLookupUpdate(bsff, tx);
  }
};

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      bsffId: { not: null }
    }
  });
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.bsff.findMany({
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
      select: minimalBsffForLookupSelect
    });
    const createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
    for (const bsff of items) {
      const createInputs = bsffToLookupCreateInputs(bsff);
      if (createInputs.incoming) {
        createArray.push(createInputs.incoming);
      }
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
