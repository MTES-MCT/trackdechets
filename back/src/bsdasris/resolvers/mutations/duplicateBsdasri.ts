import {
  Bsdasri,
  BsdasriStatus,
  BsdasriType,
  Prisma,
  User
} from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import type {
  MutationDuplicateBsdasriArgs,
  MutationResolvers
} from "@td/codegen-back";
import { expandBsdasriFromDB } from "../../converter";
import { getFullBsdasriOrNotFound } from "../../database";
import { getBsdasriRepository } from "../../repository";
import { checkCanDuplicate } from "../../permissions";
import { prisma } from "@td/prisma";
import { ForbiddenError } from "../../../common/errors";

import { prismaToZodBsdasri } from "../../validation/helpers";
import { PrismaBsdasriForParsing } from "../../validation/types";
import { parseBsdasriAsync } from "../../validation";

/**
 *
 * Duplicate a bsdasri
 * Get rid of out a bunch of non duplicatable fields, including:
 *  - regroupment info
 *  - signatures
 *  - acceptation statuses and related fields
 *  - waste details info for transporter and recipient
 */
const duplicateBsdasriResolver: MutationResolvers["duplicateBsdasri"] = async (
  _,
  { id }: MutationDuplicateBsdasriArgs,
  context
) => {
  const user = checkIsAuthenticated(context);

  const prismaBsdasri = await getFullBsdasriOrNotFound(id, {
    include: {
      grouping: true,
      synthesizing: true,
      intermediaries: true
    }
  });

  if (prismaBsdasri.type !== BsdasriType.SIMPLE) {
    throw new ForbiddenError(
      "Les dasris de synthèse ou de groupement ne sont pas duplicables"
    );
  }

  await checkCanDuplicate(user, prismaBsdasri);

  const bsdasriRepository = getBsdasriRepository(user);

  const duplicateData = await getDuplicateData(prismaBsdasri, user);

  const newBsdasri = await bsdasriRepository.create(duplicateData);

  return expandBsdasriFromDB(newBsdasri);
};

async function getDuplicateData(
  bsdasri: PrismaBsdasriForParsing,
  user: User
): Promise<Prisma.BsdasriCreateInput> {
  const {
    id,
    createdAt,

    isDraft,
    isDeleted,

    // emissionSignatoryId,
    emitterEmissionSignatureDate,
    emitterEmissionSignatureAuthor,

    emitterWasteWeightValue,
    emitterWastePackagings,
    emitterWasteWeightIsEstimate,
    emitterWasteVolume,

    isEmissionDirectTakenOver,
    isEmissionTakenOverWithSecretCode,

    transporterAcceptationStatus,
    transporterWasteRefusalReason,
    transporterWasteRefusedWeightValue,
    transporterTakenOverAt,
    transporterWastePackagings,
    transporterWasteWeightValue,
    transporterWasteWeightIsEstimate,
    transporterWasteVolume,
    transporterTransportPlates,
    handedOverToRecipientAt,
    // transportSignatoryId,
    transporterTransportSignatureDate,
    transporterTransportSignatureAuthor,
    destinationWastePackagings,
    destinationReceptionAcceptationStatus,
    destinationReceptionWasteRefusalReason,
    destinationReceptionWasteRefusedWeightValue,
    destinationReceptionWasteWeightValue,
    destinationReceptionWasteVolume,
    destinationReceptionDate,

    // receptionSignatoryId,
    destinationReceptionSignatureDate,
    destinationReceptionSignatureAuthor,

    destinationOperationDate,
    destinationOperationCode,
    destinationOperationMode,

    // operationSignatoryId,
    destinationOperationSignatureDate,
    destinationOperationSignatureAuthor,
    // groupedInId,
    // synthesizedInId,
    identificationNumbers,
    // synthesisEmitterSirets,
    // groupingEmitterSirets,
    // canAccessDraftOrgIds,

    intermediariesOrgIds,
    ...zodBdasri
  } = prismaToZodBsdasri(bsdasri);

  const { intermediaries, ...parsedBsdasri } = await parseBsdasriAsync(
    zodBdasri,
    {
      user
    }
  );

  const { emitter, transporter, destination, broker, trader } =
    await getBsdasriCompanies(bsdasri);

  let data: Prisma.BsdasriCreateInput = {
    ...parsedBsdasri,
    id: getReadableId(ReadableIdPrefix.DASRI),
    status: BsdasriStatus.INITIAL,
    isDraft: true,
    isDuplicateOf: bsdasri.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    groupedIn: undefined,
    synthesizedIn: undefined,
    grouping: undefined, // el famoso ceinture et bretelles® technology
    synthesizing: undefined,
    // Emitter company info
    emitterCompanyName: emitter?.name ?? parsedBsdasri.emitterCompanyName,
    emitterCompanyAddress:
      emitter?.address ?? parsedBsdasri.emitterCompanyAddress,
    emitterCompanyContact:
      emitter?.contact ?? parsedBsdasri.emitterCompanyContact,
    emitterCompanyPhone:
      emitter?.contactPhone ?? parsedBsdasri.emitterCompanyPhone,
    emitterCompanyMail:
      emitter?.contactEmail ?? parsedBsdasri.emitterCompanyMail,
    // Destination company info
    destinationCompanyName:
      destination?.name ?? parsedBsdasri.destinationCompanyName,
    destinationCompanyAddress:
      destination?.address ?? parsedBsdasri.destinationCompanyAddress,
    destinationCompanyContact:
      destination?.contact ?? parsedBsdasri.destinationCompanyContact,
    destinationCompanyPhone:
      destination?.contactPhone ?? parsedBsdasri.destinationCompanyPhone,
    destinationCompanyMail:
      destination?.contactEmail ?? parsedBsdasri.destinationCompanyMail,
    // Transporter company info
    transporterCompanyName:
      transporter?.name ?? parsedBsdasri.transporterCompanyName,
    transporterCompanyAddress:
      transporter?.address ?? parsedBsdasri.transporterCompanyAddress,
    transporterCompanyContact:
      transporter?.contact ?? parsedBsdasri.transporterCompanyContact,
    transporterCompanyPhone:
      transporter?.contactPhone ?? parsedBsdasri.transporterCompanyPhone,
    transporterCompanyMail:
      transporter?.contactEmail ?? parsedBsdasri.transporterCompanyMail,
    transporterCompanyVatNumber: parsedBsdasri.transporterCompanyVatNumber,
    // Transporter recepisse
    transporterRecepisseNumber:
      transporter?.transporterReceipt?.receiptNumber ?? null,
    transporterRecepisseValidityLimit:
      transporter?.transporterReceipt?.validityLimit ?? null,
    transporterRecepisseDepartment:
      transporter?.transporterReceipt?.department ?? null,
    // Broker company info

    brokerCompanyName: broker?.name ?? parsedBsdasri.brokerCompanyName,
    brokerCompanyAddress: broker?.address ?? parsedBsdasri.brokerCompanyAddress,
    brokerCompanyMail: broker?.contactEmail ?? bsdasri.brokerCompanyMail,
    brokerCompanyPhone: broker?.contactPhone ?? bsdasri.brokerCompanyPhone,
    brokerCompanyContact: broker?.contact ?? bsdasri.brokerCompanyContact,

    // Broker recepisse
    brokerRecepisseNumber: broker?.brokerReceipt?.receiptNumber ?? null,
    brokerRecepisseValidityLimit: broker?.brokerReceipt?.validityLimit ?? null,
    brokerRecepisseDepartment: broker?.brokerReceipt?.department ?? null,
    // Trader company info

    traderCompanyName: trader?.name ?? parsedBsdasri.traderCompanyName,
    traderCompanyAddress: trader?.address ?? parsedBsdasri.traderCompanyAddress,

    traderCompanyMail: trader?.contactEmail ?? bsdasri.traderCompanyMail,
    traderCompanyPhone: trader?.contactPhone ?? bsdasri.traderCompanyPhone,
    traderCompanyContact: trader?.contact ?? bsdasri.traderCompanyContact,
    // Trader recepisse
    traderRecepisseNumber: trader?.traderReceipt?.receiptNumber ?? null,
    traderRecepisseValidityLimit: trader?.traderReceipt?.validityLimit ?? null,
    traderRecepisseDepartment: trader?.traderReceipt?.department ?? null
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
  return data;
}

async function getBsdasriCompanies(bsdasri: Bsdasri) {
  const companiesOrgIds: string[] = [
    bsdasri.emitterCompanySiret,
    bsdasri.transporterCompanySiret,
    bsdasri.transporterCompanyVatNumber,
    bsdasri.destinationCompanySiret,
    bsdasri.brokerCompanySiret,
    bsdasri.traderCompanySiret
  ].filter(Boolean);

  // Batch call all companies involved
  const companies = await prisma.company.findMany({
    where: {
      siret: {
        in: companiesOrgIds
      }
    },
    include: {
      transporterReceipt: true,
      brokerReceipt: true,
      traderReceipt: true
    }
  });

  const emitter = companies.find(
    company => company.orgId === bsdasri.emitterCompanySiret
  );
  const transporter = companies.find(
    company =>
      company.orgId === bsdasri.transporterCompanySiret ||
      company.orgId === bsdasri.transporterCompanyVatNumber
  );
  const destination = companies.find(
    company => company.orgId === bsdasri.destinationCompanySiret
  );

  const broker = companies.find(
    company => company.orgId === bsdasri.brokerCompanySiret
  );

  const trader = companies.find(
    company => company.orgId === bsdasri.traderCompanySiret
  );

  return { emitter, transporter, destination, broker, trader };
}

export default duplicateBsdasriResolver;
