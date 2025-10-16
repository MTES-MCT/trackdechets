import {
  Prisma,
  BsvhuStatus,
  User,
  BsvhuIdentificationType,
  BsvhuPackaging
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import type { MutationDuplicateBsvhuArgs } from "@td/codegen-back";
import { expandVhuFormFromDb } from "../../converter";
import { getBsvhuOrNotFound } from "../../database";
import { getBsvhuRepository } from "../../repository";
import { checkCanDuplicate } from "../../permissions";
import { prisma } from "@td/prisma";
import { prismaToZodBsvhu } from "../../validation/helpers";
import { parseBsvhuAsync } from "../../validation";

import {
  BsvhuForParsingInclude,
  PrismaBsvhuForParsing
} from "../../validation/types";

// We introduced new rules for these fields after V20241201, we have to replace
// not compliant values when duplicating
const setPackagingAndIdentificationType = (packaging, identificationType) => {
  if (
    identificationType === BsvhuIdentificationType.NUMERO_ORDRE_LOTS_SORTANTS
  ) {
    return {
      packaging: BsvhuPackaging.UNITE,
      identificationType: BsvhuIdentificationType.NUMERO_IMMATRICULATION
    };
  }
  if (packaging === BsvhuPackaging.LOT) {
    return { packaging: BsvhuPackaging.LOT, identificationType: null };
  }

  return {
    identificationType:
      identificationType || BsvhuIdentificationType.NUMERO_IMMATRICULATION
  };
};

export default async function duplicate(
  _,
  { id }: MutationDuplicateBsvhuArgs,
  context
) {
  const user = checkIsAuthenticated(context);

  const prismaBsvhu = await getBsvhuOrNotFound(id, {
    include: BsvhuForParsingInclude
  });

  await checkCanDuplicate(user, prismaBsvhu);
  const bsvhuRepository = getBsvhuRepository(user);

  const duplicateData = await getDuplicateData(prismaBsvhu, user);

  const newBsvhu = await bsvhuRepository.create(duplicateData);

  return expandVhuFormFromDb(newBsvhu);
}

async function getDuplicateData(
  bsvhu: PrismaBsvhuForParsing,
  user: User
): Promise<Prisma.BsvhuCreateInput> {
  const {
    id,
    emitterEmissionSignatureAuthor,
    emitterEmissionSignatureDate,
    destinationReceptionQuantity,
    destinationReceptionWeight,
    destinationReceptionAcceptationStatus,
    destinationReceptionRefusalReason,
    destinationReceptionIdentificationNumbers,
    destinationReceptionIdentificationType,
    destinationReceptionDate,
    destinationOperationDate,
    destinationOperationCode,
    destinationOperationMode,
    destinationOperationSignatureAuthor,
    destinationOperationSignatureDate,
    destinationReceptionSignatureAuthor,
    destinationReceptionSignatureDate,
    intermediariesOrgIds,
    transportersOrgIds,
    ...zodBsvhu
  } = prismaToZodBsvhu(bsvhu);

  const { intermediaries, transporters, ...parsedBsvhu } =
    await parseBsvhuAsync(zodBsvhu, {
      user
    });

  const {
    emitter,
    destination,
    broker,
    trader,
    transporters: transporterCompanies
  } = await getBsvhuCompanies(bsvhu);
  let data: Prisma.BsvhuCreateInput = {
    ...parsedBsvhu,
    id: getReadableId(ReadableIdPrefix.VHU),
    status: BsvhuStatus.INITIAL,
    isDraft: true,
    isDuplicateOf: bsvhu.id,
    createdAt: new Date(),
    emitterCompanyContact:
      emitter?.contact ?? parsedBsvhu.emitterCompanyContact,
    emitterCompanyPhone:
      emitter?.contactPhone ?? parsedBsvhu.emitterCompanyPhone,
    emitterCompanyMail: emitter?.contactEmail ?? parsedBsvhu.emitterCompanyMail,
    destinationCompanyContact:
      destination?.contact ?? parsedBsvhu.destinationCompanyContact,
    destinationCompanyPhone:
      destination?.contactPhone ?? parsedBsvhu.destinationCompanyPhone,
    destinationCompanyMail:
      destination?.contactEmail ?? parsedBsvhu.destinationCompanyMail,
    // Broker company info
    brokerCompanyMail: broker?.contactEmail ?? bsvhu.brokerCompanyMail,
    brokerCompanyPhone: broker?.contactPhone ?? bsvhu.brokerCompanyPhone,
    brokerCompanyContact: broker?.contact ?? bsvhu.brokerCompanyContact,
    // Broker recepisse
    brokerRecepisseNumber:
      broker?.brokerReceipt?.receiptNumber ?? bsvhu.brokerRecepisseNumber,
    brokerRecepisseValidityLimit:
      broker?.brokerReceipt?.validityLimit ??
      bsvhu.brokerRecepisseValidityLimit,
    brokerRecepisseDepartment:
      broker?.brokerReceipt?.department ?? bsvhu.brokerRecepisseDepartment,
    // Trader company info
    traderCompanyMail: trader?.contactEmail ?? bsvhu.traderCompanyMail,
    traderCompanyPhone: trader?.contactPhone ?? bsvhu.traderCompanyPhone,
    traderCompanyContact: trader?.contact ?? bsvhu.traderCompanyContact,
    // Trader recepisse
    traderRecepisseNumber:
      trader?.traderReceipt?.receiptNumber ?? bsvhu.traderRecepisseNumber,
    traderRecepisseValidityLimit:
      trader?.traderReceipt?.validityLimit ??
      bsvhu.traderRecepisseValidityLimit,
    traderRecepisseDepartment:
      trader?.traderReceipt?.department ?? bsvhu.traderRecepisseDepartment,
    // NUMERO_ORDRE_LOTS_SORTANTS is deprecated for new bsvhus, we set an arbitrary value
    ...setPackagingAndIdentificationType(
      bsvhu.packaging,
      bsvhu.identificationType
    )
  };
  if (intermediaries) {
    data = {
      ...data,
      intermediaries: {
        createMany: {
          data: intermediaries.map(intermediary => ({
            siret: intermediary.siret!,
            address: intermediary.address,
            vatNumber: intermediary.vatNumber,
            name: intermediary.name!,
            contact: intermediary.contact!,
            phone: intermediary.phone,
            mail: intermediary.mail
          }))
        }
      },
      intermediariesOrgIds
    };
  }
  if (transporters) {
    data = {
      ...data,
      transportersOrgIds: transporters
        .flatMap(t => [
          t.transporterCompanySiret,
          t.transporterCompanyVatNumber
        ])
        .filter(Boolean),
      transporters: {
        createMany: {
          data: transporters
            .sort((a, b) => (a.number ?? 1) - (b.number ?? 1))
            .map((transporter, index) => {
              const transporterCompany = transporterCompanies.find(
                t =>
                  t.orgId === transporter.transporterCompanySiret ||
                  t.orgId === transporter.transporterCompanyVatNumber
              );
              const {
                // transport values that should not be duplicated
                id: transporterId,
                createdAt,
                bsvhuId: transporterBsvhuId,
                transporterTransportPlates,
                transporterTransportTakenOverAt,
                transporterTransportSignatureAuthor,
                transporterTransportSignatureDate,
                transporterCustomInfo,
                number,
                // transporter values that should be duplicated
                ...transporterData
              } = transporter;
              return {
                ...transporterData,
                number: index + 1,
                // Transporter company info
                transporterCompanyMail:
                  transporterCompany?.contactEmail ??
                  transporter.transporterCompanyMail,
                transporterCompanyPhone:
                  transporterCompany?.contactPhone ??
                  transporter.transporterCompanyPhone,
                transporterCompanyContact:
                  transporterCompany?.contact ??
                  transporter.transporterCompanyContact,
                // Transporter recepisse
                transporterRecepisseNumber:
                  transporterCompany?.transporterReceipt?.receiptNumber ?? null,
                transporterRecepisseValidityLimit:
                  transporterCompany?.transporterReceipt?.validityLimit ?? null,
                transporterRecepisseDepartment:
                  transporterCompany?.transporterReceipt?.department ?? null
              };
            })
        }
      }
    };
  }
  return data;
}

async function getBsvhuCompanies(bsvhu: PrismaBsvhuForParsing) {
  const companiesOrgIds = [
    bsvhu.emitterCompanySiret,
    bsvhu.destinationCompanySiret,
    bsvhu.brokerCompanySiret,
    bsvhu.traderCompanySiret,
    ...bsvhu.transporters.flatMap(transporter => [
      transporter.transporterCompanySiret,
      transporter.transporterCompanyVatNumber
    ])
  ].filter(Boolean);

  // Batch fetch all companies involved in the BSVHU
  const companies = await prisma.company.findMany({
    where: { orgId: { in: companiesOrgIds } },
    include: {
      transporterReceipt: true,
      brokerReceipt: true,
      traderReceipt: true
    }
  });

  const emitter = companies.find(
    company => company.orgId === bsvhu.emitterCompanySiret
  );

  const destination = companies.find(
    company => company.orgId === bsvhu.destinationCompanySiret
  );

  const broker = companies.find(
    company => company.orgId === bsvhu.brokerCompanySiret
  );

  const trader = companies.find(
    company => company.orgId === bsvhu.traderCompanySiret
  );

  const transporters = companies.filter(company =>
    bsvhu.transporters.some(
      transporter =>
        transporter.transporterCompanySiret === company.orgId ||
        transporter.transporterCompanyVatNumber === company.orgId
    )
  );

  return { emitter, destination, broker, trader, transporters };
}
