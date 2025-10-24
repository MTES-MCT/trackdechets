import { Bspaoh, BspaohStatus, Prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import type {
  MutationDuplicateBspaohArgs,
  MutationResolvers
} from "@td/codegen-back";
import { expandBspaohFromDb } from "../../converter";
import { getBspaohOrNotFound, getBspaohFirstTransporter } from "../../database";

import { checkCanDuplicate } from "../../permissions";
import { prisma } from "@td/prisma";
import { getBspaohRepository } from "../../repository";

import { prepareBspaohForParsing, prepareBspaohInputs } from "./utils";
import { parseBspaohInContext } from "../../validation";
import { isObject, isArray } from "../../../common/dataTypes";

async function getBspaohCompanies(bspaoh: Bspaoh) {
  const firstTransporter = await getBspaohFirstTransporter(bspaoh);

  const companiesOrgIds: string[] = [
    bspaoh.emitterCompanySiret,
    bspaoh.destinationCompanySiret,
    firstTransporter?.transporterCompanySiret,
    firstTransporter?.transporterCompanyVatNumber
  ].filter(Boolean);

  // Batch call companies with their receipts
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
    company => company.orgId === bspaoh.emitterCompanySiret
  );
  const transporter = companies.find(
    company =>
      company.orgId === firstTransporter?.transporterCompanySiret ||
      company.orgId === firstTransporter?.transporterCompanyVatNumber
  );
  const destination = companies.find(
    company => company.orgId === bspaoh.destinationCompanySiret
  );

  return {
    emitter,
    transporter,
    destination
  };
}

/**
 *
 * Duplicate a bspaoh
 * Get rid of out a bunch of non duplicatable fields, including:
 *  - signatures
 *  - acceptation statuses and related fields
 *  - waste details info for transporter and recipient
 * Refresh input data by querying db and sirenifying companies
 */
const duplicateBspaohResolver: MutationResolvers["duplicateBspaoh"] = async (
  _,
  { id }: MutationDuplicateBspaohArgs,
  context
) => {
  const user = checkIsAuthenticated(context);

  const bspaoh = await getBspaohOrNotFound({
    id
  });

  await checkCanDuplicate(user, bspaoh);

  const { preparedExistingBspaoh } = prepareBspaohForParsing(bspaoh);
  const parsed = await parseBspaohInContext(
    { input: {}, persisted: { ...preparedExistingBspaoh } },
    {
      currentSignatureType: undefined,
      enableCompletionTransformers: true,
      isCreation: true
    }
  );

  const { preparedBspaohInput, preparedBspaohTransporterInput } =
    prepareBspaohInputs(parsed);

  const newBspaoh = await duplicateBspaoh(
    user,
    preparedBspaohInput,
    preparedBspaohTransporterInput
  );
  return expandBspaohFromDb(newBspaoh);
};

const cleanPackaging = packaging => {
  if (isObject(packaging)) return { ...packaging, identificationCodes: [] };
};

const cleanPackagings = wastePackagings => {
  if (wastePackagings === null) {
    return Prisma.JsonNull;
  }
  if (isArray(wastePackagings)) {
    return wastePackagings?.map(packaging => cleanPackaging(packaging));
  }
  return wastePackagings;
};

async function duplicateBspaoh(
  user: Express.User,
  bspaoh: Bspaoh,
  bspaohTransporter
) {
  const {
    id,
    createdAt,
    updatedAt,
    isDuplicateOf,

    emitterEmissionSignatureDate,
    emitterEmissionSignatureAuthor,

    handedOverToDestinationSignatureDate,
    handedOverToDestinationSignatureAuthor,
    destinationReceptionWasteQuantityValue,

    destinationReceptionWasteReceivedWeightValue,
    destinationReceptionWasteAcceptedWeightValue,
    destinationReceptionWasteRefusedWeightValue,

    destinationReceptionAcceptationStatus,
    destinationReceptionWasteRefusalReason,
    destinationReceptionWastePackagingsAcceptation,

    destinationReceptionDate,
    destinationReceptionSignatureDate,
    destinationReceptionSignatureAuthor,

    destinationOperationCode,
    destinationOperationDate,
    destinationOperationSignatureDate,
    destinationOperationSignatureAuthor,
    currentTransporterOrgId,
    nextTransporterOrgId,
    transportersSirets,
    canAccessDraftSirets,
    wastePackagings,
    ...fieldsToCopy
  } = bspaoh;

  const {
    id: trsId,
    bspaohId,
    createdAt: trsCreatedAt,
    updatedAt: trsUpdatedAt,
    transporterTransportPlates,

    ...trsFieldsToCopy
  } = bspaohTransporter;

  const { emitter, transporter, destination } = await getBspaohCompanies(
    bspaoh
  );

  const input = {
    ...fieldsToCopy,
    wastePackagings: cleanPackagings(wastePackagings),
    id: getReadableId(ReadableIdPrefix.PAOH),
    status: BspaohStatus.DRAFT,
    isDuplicateOf: bspaoh.id,

    // Emitter company info

    emitterCompanyMail: emitter?.contactEmail ?? bspaoh.emitterCompanyMail,
    emitterCompanyPhone: emitter?.contactPhone ?? bspaoh.emitterCompanyPhone,

    emitterCompanyContact: emitter?.contact ?? bspaoh.emitterCompanyContact,
    // Destination company info

    destinationCompanyMail:
      destination?.contactEmail ?? bspaoh.destinationCompanyMail,
    destinationCompanyPhone:
      destination?.contactPhone ?? bspaoh.destinationCompanyPhone,

    destinationCompanyContact:
      destination?.contact ?? bspaoh.destinationCompanyContact,

    transporters: {
      create: {
        ...trsFieldsToCopy,

        transporterCompanyContact: transporter?.contact,
        transporterCompanyPhone: transporter?.contactPhone,
        transporterCompanyMail: transporter?.contactEmail,

        transporterRecepisseNumber:
          transporter?.transporterReceipt?.receiptNumber ?? null,
        transporterRecepisseDepartment:
          transporter?.transporterReceipt?.department ?? null,
        transporterRecepisseValidityLimit:
          transporter?.transporterReceipt?.validityLimit ?? null,

        number: 1
      }
    }
  };

  const bspaohRepository = getBspaohRepository(user);

  return bspaohRepository.create({
    ...input,
    id: getReadableId(ReadableIdPrefix.PAOH),
    status: BspaohStatus.DRAFT
  });
}

export default duplicateBspaohResolver;
