import { Bsdasri, BsdasriStatus, BsdasriType, Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import {
  MutationDuplicateBsdasriArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { expandBsdasriFromDB } from "../../converter";
import { getBsdasriOrNotFound } from "../../database";
import { getBsdasriRepository } from "../../repository";
import { checkCanDuplicate } from "../../permissions";
import { prisma } from "@td/prisma";
import { ForbiddenError } from "../../../common/errors";
import { sirenifyBsdasriCreateInput } from "../../sirenify";

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

  const bsdasri = await getBsdasriOrNotFound({
    id
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

async function duplicateBsdasri(user: Express.User, bsdasri: Bsdasri) {
  const {
    id,
    createdAt,
    updatedAt,

    emissionSignatoryId,
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
    handedOverToRecipientAt,
    transportSignatoryId,
    transporterTransportSignatureDate,
    transporterTransportSignatureAuthor,

    destinationWastePackagings,
    destinationReceptionAcceptationStatus,
    destinationReceptionWasteRefusalReason,
    destinationReceptionWasteRefusedWeightValue,
    destinationReceptionWasteWeightValue,
    destinationReceptionWasteVolume,
    destinationReceptionDate,

    receptionSignatoryId,
    destinationReceptionSignatureDate,
    destinationReceptionSignatureAuthor,

    destinationOperationDate,

    operationSignatoryId,
    destinationOperationSignatureDate,
    destinationOperationSignatureAuthor,
    groupedInId,
    synthesizedInId,
    identificationNumbers,
    synthesisEmitterSirets,
    groupingEmitterSirets,
    ...fieldsToCopy
  } = bsdasri;

  const bsdasriRepository = getBsdasriRepository(user);

  const { emitter, transporter, destination } = await getBsdasriCompanies(
    bsdasri
  );

  const input: Prisma.BsdasriCreateInput = {
    ...fieldsToCopy,
    id: getReadableId(ReadableIdPrefix.DASRI),
    status: BsdasriStatus.INITIAL,
    isDraft: true,
    // Emitter company info
    emitterCompanyAddress: emitter?.address ?? bsdasri.emitterCompanyAddress,
    emitterCompanyMail: emitter?.contactEmail ?? bsdasri.emitterCompanyMail,
    emitterCompanyPhone: emitter?.contactPhone ?? bsdasri.emitterCompanyPhone,
    emitterCompanyName: emitter?.name ?? bsdasri.emitterCompanyName,
    emitterCompanyContact: emitter?.contact ?? bsdasri.emitterCompanyContact,
    // Destination company info
    destinationCompanyAddress:
      destination?.address ?? bsdasri.destinationCompanyAddress,
    destinationCompanyMail:
      destination?.contactEmail ?? bsdasri.destinationCompanyMail,
    destinationCompanyPhone:
      destination?.contactPhone ?? bsdasri.destinationCompanyPhone,
    destinationCompanyName: destination?.name ?? bsdasri.destinationCompanyName,
    destinationCompanyContact:
      destination?.contact ?? bsdasri.destinationCompanyContact,
    // Transporter company info
    transporterCompanyAddress:
      transporter?.address ?? bsdasri.transporterCompanyAddress,
    transporterCompanyMail:
      transporter?.contactEmail ?? bsdasri.transporterCompanyMail,
    transporterCompanyPhone:
      transporter?.contactPhone ?? bsdasri.transporterCompanyPhone,
    transporterCompanyName: transporter?.name ?? bsdasri.transporterCompanyName,
    transporterCompanyContact:
      transporter?.contact ?? bsdasri.transporterCompanyContact,
    // Transporter recepisse
    transporterRecepisseNumber:
      transporter?.transporterReceipt?.receiptNumber ?? null,
    transporterRecepisseValidityLimit:
      transporter?.transporterReceipt?.validityLimit ?? null,
    transporterRecepisseDepartment:
      transporter?.transporterReceipt?.department ?? null
  };

  const sirenified = await sirenifyBsdasriCreateInput(input, []);

  return bsdasriRepository.create(sirenified);
}

async function getBsdasriCompanies(bsdasri: Bsdasri) {
  const companiesOrgIds: string[] = [
    bsdasri.emitterCompanySiret,
    bsdasri.transporterCompanySiret,
    bsdasri.transporterCompanyVatNumber,
    bsdasri.destinationCompanySiret
  ].filter(Boolean);

  // Batch call all companies involved
  const companies = await prisma.company.findMany({
    where: {
      siret: {
        in: companiesOrgIds
      }
    },
    include: {
      transporterReceipt: true
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

  return { emitter, transporter, destination };
}

export default duplicateBsdasriResolver;
