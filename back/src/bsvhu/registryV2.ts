import {
  Prisma,
  PrismaClient,
  RegistryExportDeclarationType,
  RegistryExportType,
  RegistryExportWasteType
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { ITXClientDenyList } from "@prisma/client/runtime/library";
import type { IncomingWasteV2 } from "@td/codegen-back";
import { getWasteDescription } from "./utils";
import { getBsvhuSubType } from "../common/subTypes";
import { splitAddress } from "../common/addresses";
import Decimal from "decimal.js";
import { emptyIncomingWasteV2, RegistryV2Bsvhu } from "../registryV2/types";
import { deleteRegistryLookup, generateDateInfos } from "@td/registry";

export const toIncomingWasteV2 = (
  bsvhu: RegistryV2Bsvhu
): Omit<Required<IncomingWasteV2>, "__typename"> => {
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

  const {
    street: transporter1CompanyAddress,
    postalCode: transporter1CompanyPostalCode,
    city: transporter1CompanyCity,
    country: transporter1CompanyCountry
  } = splitAddress(
    bsvhu.transporterCompanyAddress,
    bsvhu.transporterCompanyVatNumber
  );
  const {
    street: destinationCompanyAddress,
    postalCode: destinationCompanyPostalCode,
    city: destinationCompanyCity
  } = splitAddress(bsvhu.destinationCompanyAddress);
  return {
    ...emptyIncomingWasteV2,
    id: bsvhu.id,
    source: "BSD",
    publicId: null,
    bsdId: bsvhu.id,
    reportAsSiret: null,
    createdAt: bsvhu.createdAt,
    updatedAt: bsvhu.createdAt,
    transporterTakenOverAt: bsvhu.transporterTransportTakenOverAt,
    destinationReceptionDate: bsvhu.destinationReceptionDate,
    weighingHour: null,
    destinationOperationDate: bsvhu.destinationOperationDate,
    bsdType: "BSVHU",
    bsdSubType: getBsvhuSubType(bsvhu),
    customId: bsvhu.customId,
    status: bsvhu.status,
    wasteDescription: getWasteDescription(bsvhu.wasteCode),
    wasteCode: bsvhu.wasteCode,
    wasteCodeBale: null,
    wastePop: false,
    wasteIsDangerous: true,
    weight: bsvhu.weightValue
      ? new Decimal(bsvhu.weightValue)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.weightValue,
    emitterCompanyIrregularSituation: !!bsvhu.emitterIrregularSituation,
    emitterCompanyName: bsvhu.emitterCompanyName,
    emitterCompanyGivenName: null,
    emitterCompanySiret: bsvhu.emitterCompanySiret,
    emitterCompanyAddress,
    emitterCompanyPostalCode,
    emitterCompanyCity,
    emitterCompanyCountry,
    emitterCompanyMail: bsvhu.emitterCompanyMail,
    ecoOrganismeName: bsvhu.ecoOrganismeName,
    ecoOrganismeSiret: bsvhu.ecoOrganismeSiret,
    traderCompanyName: bsvhu.traderCompanyName,
    traderCompanySiret: bsvhu.traderCompanySiret,
    traderCompanyMail: bsvhu.traderCompanyMail,
    traderRecepisseNumber: bsvhu.traderRecepisseNumber,
    brokerCompanyName: bsvhu.brokerCompanyName,
    brokerCompanySiret: bsvhu.brokerCompanySiret,
    brokerCompanyMail: bsvhu.brokerCompanyMail,
    brokerRecepisseNumber: bsvhu.brokerRecepisseNumber,
    isDirectSupply: false,
    transporter1CompanyName: bsvhu.transporterCompanyName,
    transporter1CompanyGivenName: null,
    transporter1CompanySiret: bsvhu.transporterCompanySiret,
    transporter1CompanyAddress,
    transporter1CompanyPostalCode,
    transporter1CompanyCity,
    transporter1CompanyCountry,
    transporter1RecepisseIsExempted: bsvhu.transporterRecepisseIsExempted,
    transporter1RecepisseNumber: bsvhu.transporterRecepisseNumber,
    transporter1TransportMode: null,
    transporter1CompanyMail: bsvhu.transporterCompanyMail,
    wasteAdr: null,
    nonRoadRegulationMention: null,
    destinationCap: null,
    wasteDap: null,
    destinationCompanyName: bsvhu.destinationCompanyName,
    destinationCompanyGivenName: null,
    destinationCompanySiret: bsvhu.destinationCompanySiret,
    destinationCompanyAddress,
    destinationCompanyPostalCode,
    destinationCompanyCity,
    destinationCompanyMail: bsvhu.destinationCompanyMail,
    destinationReceptionAcceptationStatus:
      bsvhu.destinationReceptionAcceptationStatus,
    destinationReceptionWeight: bsvhu.destinationReceptionWeight
      ? new Decimal(bsvhu.destinationReceptionWeight)
          .dividedBy(1000)
          .toDecimalPlaces(6)
          .toNumber()
      : bsvhu.destinationReceptionWeight,
    destinationReceptionRefusedWeight: null,
    destinationReceptionAcceptedWeight: null,
    destinationReceptionWeightIsEstimate: false,
    destinationPlannedOperationCode: bsvhu.destinationPlannedOperationCode,
    destinationOperationCode: bsvhu.destinationOperationCode,
    destinationOperationMode: bsvhu.destinationOperationMode,
    destinationOperationNoTraceability: false
  };
};

const minimalBsvhuForLookupSelect = {
  id: true,
  destinationOperationSignatureDate: true,
  destinationCompanySiret: true,
  wasteCode: true
};

type MinimalBsvhuForLookup = Prisma.BsvhuGetPayload<{
  select: typeof minimalBsvhuForLookupSelect;
}>;

const bsvhuToLookupCreateInputs = (
  bsvhu: MinimalBsvhuForLookup
): { incoming: Prisma.RegistryLookupUncheckedCreateInput | null } => {
  const res: { incoming: Prisma.RegistryLookupUncheckedCreateInput | null } = {
    incoming: null
  };
  if (
    bsvhu.destinationOperationSignatureDate &&
    bsvhu.destinationCompanySiret
  ) {
    res.incoming = {
      id: bsvhu.id,
      readableId: bsvhu.id,
      siret: bsvhu.destinationCompanySiret,
      exportRegistryType: RegistryExportType.INCOMING,
      declarationType: RegistryExportDeclarationType.BSD,
      wasteType: RegistryExportWasteType.DD,
      wasteCode: bsvhu.wasteCode,
      ...generateDateInfos(bsvhu.destinationOperationSignatureDate),
      bsvhuId: bsvhu.id
    };
  }
  return res;
};

const performRegistryLookupUpdate = async (
  bsvhu: MinimalBsvhuForLookup,
  tx: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  await deleteRegistryLookup(bsvhu.id, tx);
  const lookupInputs = bsvhuToLookupCreateInputs(bsvhu);
  if (lookupInputs.incoming) {
    await tx.registryLookup.create({
      data: lookupInputs.incoming,
      select: { id: true }
    });
  }
};

export const updateRegistryLookup = async (
  bsvhu: MinimalBsvhuForLookup,
  tx?: Omit<PrismaClient, ITXClientDenyList>
): Promise<void> => {
  if (!tx) {
    await prisma.$transaction(async transaction => {
      await performRegistryLookupUpdate(bsvhu, transaction);
    });
  } else {
    await performRegistryLookupUpdate(bsvhu, tx);
  }
};

export const rebuildRegistryLookup = async () => {
  await prisma.registryLookup.deleteMany({
    where: {
      bsvhuId: { not: null }
    }
  });
  let done = false;
  let cursorId: string | null = null;
  while (!done) {
    const items = await prisma.bsvhu.findMany({
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
      select: minimalBsvhuForLookupSelect
    });
    const createArray: Prisma.RegistryLookupUncheckedCreateInput[] = [];
    for (const bsvhu of items) {
      const createInputs = bsvhuToLookupCreateInputs(bsvhu);
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
