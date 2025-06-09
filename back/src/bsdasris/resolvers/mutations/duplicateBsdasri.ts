import { Bsdasri, BsdasriStatus, BsdasriType, Prisma } from "@prisma/client";
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
import { sirenifyBsdasriCreateInput } from "../../sirenify";
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

  const bsdasri = await getFullBsdasriOrNotFound(id, {
    include: {
      grouping: true,
      synthesizing: true,
      intermediaries: true
    }
  });

  if (bsdasri.type !== BsdasriType.SIMPLE) {
    throw new ForbiddenError(
      "Les dasris de synthèse ou de groupement ne sont pas duplicables"
    );
  }

  await checkCanDuplicate(user, bsdasri);

  const newBsdasri = await duplicateBsdasri(user, bsdasri);
  return expandBsdasriFromDB(newBsdasri);
};

async function duplicateBsdasri(
  user: Express.User,
  bsdasri: PrismaBsdasriForParsing
) {
  // const {
  //   id,
  //   createdAt,
  //   updatedAt,
  //   rowNumber,
  //   isDuplicateOf,

  // emissionSignatoryId,
  // emitterEmissionSignatureDate,
  // emitterEmissionSignatureAuthor,
  //
  // emitterWasteWeightValue,
  // emitterWastePackagings,
  // emitterWasteWeightIsEstimate,
  // emitterWasteVolume,
  //
  // isEmissionDirectTakenOver,
  // isEmissionTakenOverWithSecretCode,
  //
  // transporterAcceptationStatus,
  // transporterWasteRefusalReason,
  // transporterWasteRefusedWeightValue,
  // transporterTakenOverAt,
  // transporterWastePackagings,
  // transporterWasteWeightValue,
  // transporterWasteWeightIsEstimate,
  // transporterWasteVolume,
  // transporterTransportPlates,
  // handedOverToRecipientAt,
  // transportSignatoryId,
  // transporterTransportSignatureDate,
  // transporterTransportSignatureAuthor,
  //
  // destinationWastePackagings,
  // destinationReceptionAcceptationStatus,
  // destinationReceptionWasteRefusalReason,
  // destinationReceptionWasteRefusedWeightValue,
  // destinationReceptionWasteWeightValue,
  // destinationReceptionWasteVolume,
  // destinationReceptionDate,
  //
  //   receptionSignatoryId,
  //   destinationReceptionSignatureDate,
  //   destinationReceptionSignatureAuthor,
  //
  //   destinationOperationDate,
  //   destinationOperationCode,
  //   destinationOperationMode,
  //
  //   operationSignatoryId,
  //   destinationOperationSignatureDate,
  //   destinationOperationSignatureAuthor,
  //   groupedInId,
  //   synthesizedInId,
  //   identificationNumbers,
  //   synthesisEmitterSirets,
  //   groupingEmitterSirets,
  //   canAccessDraftOrgIds,
  //   ...fieldsToCopy
  // } = bsdasri;

  const {
    id,
    // createdAt,
    // updatedAt,
    // rowNumber,
    // isDuplicateOf,
    //
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
    // grouping,
    // synthesizing,

    intermediariesOrgIds,
    ...zodBsdasri
  } = prismaToZodBsdasri(bsdasri);

  const {
    intermediaries,
    createdAt,
    grouping,
    synthesizing,
    ...parsedBsdasri
  } = await parseBsdasriAsync(zodBsdasri, {
    user
  });

  const bsdasriRepository = getBsdasriRepository(user);

  const { emitter, transporter, destination, broker, trader } =
    await getBsdasriCompanies(bsdasri);

  let input: Prisma.BsdasriCreateInput = {
    ...parsedBsdasri,
    id: getReadableId(ReadableIdPrefix.DASRI),
    status: BsdasriStatus.INITIAL,
    isDraft: true,
    isDuplicateOf: bsdasri.id,

    // Emitter company info
    emitterCompanyAddress:
      emitter?.address ?? parsedBsdasri.emitterCompanyAddress,
    emitterCompanyMail:
      emitter?.contactEmail ?? parsedBsdasri.emitterCompanyMail,
    emitterCompanyPhone:
      emitter?.contactPhone ?? parsedBsdasri.emitterCompanyPhone,
    emitterCompanyName: emitter?.name ?? parsedBsdasri.emitterCompanyName,
    emitterCompanyContact:
      emitter?.contact ?? parsedBsdasri.emitterCompanyContact,
    // Destination company info
    destinationCompanyAddress:
      destination?.address ?? parsedBsdasri.destinationCompanyAddress,
    destinationCompanyMail:
      destination?.contactEmail ?? parsedBsdasri.destinationCompanyMail,
    destinationCompanyPhone:
      destination?.contactPhone ?? parsedBsdasri.destinationCompanyPhone,
    destinationCompanyName:
      destination?.name ?? parsedBsdasri.destinationCompanyName,
    destinationCompanyContact:
      destination?.contact ?? parsedBsdasri.destinationCompanyContact,
    // Transporter company info
    transporterCompanyAddress:
      transporter?.address ?? parsedBsdasri.transporterCompanyAddress,
    transporterCompanyMail:
      transporter?.contactEmail ?? parsedBsdasri.transporterCompanyMail,
    transporterCompanyPhone:
      transporter?.contactPhone ?? parsedBsdasri.transporterCompanyPhone,
    transporterCompanyName:
      transporter?.name ?? parsedBsdasri.transporterCompanyName,
    transporterCompanyContact:
      transporter?.contact ?? parsedBsdasri.transporterCompanyContact,
    // Transporter recepisse
    transporterRecepisseNumber:
      transporter?.transporterReceipt?.receiptNumber ?? null,
    transporterRecepisseValidityLimit:
      transporter?.transporterReceipt?.validityLimit ?? null,
    transporterRecepisseDepartment:
      transporter?.transporterReceipt?.department ?? null,
    // Broker company info
    brokerCompanyMail: broker?.contactEmail ?? parsedBsdasri.brokerCompanyMail,
    brokerCompanyPhone:
      broker?.contactPhone ?? parsedBsdasri.brokerCompanyPhone,
    brokerCompanyContact: broker?.contact ?? parsedBsdasri.brokerCompanyContact,
    // Broker recepisse
    brokerRecepisseNumber:
      broker?.brokerReceipt?.receiptNumber ??
      parsedBsdasri.brokerRecepisseNumber,
    brokerRecepisseValidityLimit:
      broker?.brokerReceipt?.validityLimit ??
      parsedBsdasri.brokerRecepisseValidityLimit,
    brokerRecepisseDepartment:
      broker?.brokerReceipt?.department ??
      parsedBsdasri.brokerRecepisseDepartment,
    // Trader company info
    traderCompanyMail: trader?.contactEmail ?? parsedBsdasri.traderCompanyMail,
    traderCompanyPhone:
      trader?.contactPhone ?? parsedBsdasri.traderCompanyPhone,
    traderCompanyContact: trader?.contact ?? parsedBsdasri.traderCompanyContact,
    // Trader recepisse
    traderRecepisseNumber:
      trader?.traderReceipt?.receiptNumber ??
      parsedBsdasri.traderRecepisseNumber,
    traderRecepisseValidityLimit:
      trader?.traderReceipt?.validityLimit ??
      parsedBsdasri.traderRecepisseValidityLimit,
    traderRecepisseDepartment:
      trader?.traderReceipt?.department ??
      parsedBsdasri.traderRecepisseDepartment
  };
  if (intermediaries) {
    input = {
      ...input,
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
  const sirenified = await sirenifyBsdasriCreateInput(input, []);

  return bsdasriRepository.create(sirenified);
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
