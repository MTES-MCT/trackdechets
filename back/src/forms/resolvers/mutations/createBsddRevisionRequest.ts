import { ForbiddenError, UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import * as yup from "yup";
import { Form, RevisionRequestAcceptationStatus } from "@prisma/client";
import {
  PROCESSING_OPERATIONS_CODES,
  WASTES_CODES
} from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationCreateBsddRevisionRequestArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getFormOrFormNotFound } from "../../database";
import { checkCanRequestRevision } from "../../permissions";
import {
  INVALID_PROCESSING_OPERATION,
  INVALID_SIRET_LENGTH,
  INVALID_WASTE_CODE
} from "../../validation";
import { getUserCompanies } from "../../../users/database";
import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../form-converter";

export default async function createReview(
  _,
  { bsddId, input, comment }: MutationCreateBsddRevisionRequestArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsdd = await getFormOrFormNotFound({ id: bsddId });
  await checkCanRequestRevision(user, existingBsdd);

  const unsettledExistingRevisionRequest =
    await prisma.bsddRevisionRequest.findFirst({
      where: {
        bsddId,
        validations: {
          none: { status: RevisionRequestAcceptationStatus.REFUSED },
          some: { status: RevisionRequestAcceptationStatus.PENDING }
        }
      }
    });

  if (unsettledExistingRevisionRequest) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Une autre révision est déjà en attente de validation."
    );
  }

  const { temporaryStorageDetail, ...bsddRevisionRequest } = input;
  if (temporaryStorageDetail && existingBsdd.temporaryStorageDetailId == null) {
    throw new UserInputError(
      "Impossible de réviser l'entreposage provisoire, ce bordereau n'est pas concerné."
    );
  }
  const bsddRevisionRequestContent = flattenFormInput(bsddRevisionRequest);
  await simpleReviewSchema.validate(bsddRevisionRequestContent);

  const reviewContent: any = {
    ...bsddRevisionRequestContent
  };

  if (temporaryStorageDetail) {
    const temporaryStorageReviewContent = flattenTemporaryStorageDetailInput(
      temporaryStorageDetail
    );
    await temporaryStorageDetailSchema.validate(temporaryStorageReviewContent);
    reviewContent.temporaryStorageDetail = temporaryStorageReviewContent;
  }

  const requesterCompany = await getReviewRequesterCompany(
    user.id,
    existingBsdd
  );
  const allValidationCompanies = await getReviewValidationCompanies(
    existingBsdd,
    temporaryStorageDetail == null
  );

  return prisma.bsddRevisionRequest.create({
    data: {
      bsdd: { connect: { id: existingBsdd.id } },
      content: JSON.parse(JSON.stringify(reviewContent)),
      requestedBy: { connect: { id: requesterCompany.id } },
      validations: {
        create: allValidationCompanies
          .filter(company => company.id !== requesterCompany.id)
          .map(company => ({ companyId: company.id }))
      },
      comment
    }
  });
}

async function getReviewRequesterCompany(userId: string, bsdd: Form) {
  const userCompanies = await getUserCompanies(userId);
  const userCompanySirets = new Set(
    userCompanies.map(company => company.siret)
  );

  if (userCompanySirets.has(bsdd.emitterCompanySiret))
    return userCompanies.find(
      company => company.siret === bsdd.emitterCompanySiret
    );

  if (userCompanySirets.has(bsdd.recipientCompanySiret))
    return userCompanies.find(
      company => company.siret === bsdd.recipientCompanySiret
    );

  throw new Error(
    "Unknown user role on BSDD. He should not have been allowed to create a review."
  );
}

async function getReviewValidationCompanies(
  bsdd: Form,
  isBsddOnlyReview: boolean
) {
  const simpleBsddValidators = [
    bsdd.emitterCompanySiret,
    bsdd.traderCompanySiret, // TODO ask for trader validation if there is one ?
    bsdd.recipientCompanySiret
  ].filter(Boolean);

  if (isBsddOnlyReview) {
    return prisma.company.findMany({
      where: { siret: { in: simpleBsddValidators } }
    });
  }

  const temporaryStorageDetail = await prisma.form
    .findUnique({ where: { id: bsdd.id } })
    .temporaryStorageDetail();
  const bsddWithTemporaryStorageValidators = [
    ...simpleBsddValidators,
    temporaryStorageDetail.destinationCompanySiret
  ];

  return prisma.company.findMany({
    where: { siret: { in: bsddWithTemporaryStorageValidators } }
  });
}

const simpleReviewSchema = yup
  .object({
    recipientCap: yup.string().nullable(),
    wasteDetailsCode: yup
      .string()
      .oneOf([...WASTES_CODES, "", null], INVALID_WASTE_CODE),
    wasteDetailsPop: yup.boolean().nullable(),
    quantityReceived: yup.number().nullable(),
    processingOperationDone: yup
      .string()
      .oneOf(PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION)
      .nullable(),
    brokerCompanyName: yup.string().nullable(),
    brokerCompanySiret: yup
      .string()
      .nullable()
      .matches(/^$|^\d{14}$/, {
        message: `Transporteur: ${INVALID_SIRET_LENGTH}`
      }),
    brokerCompanyAddress: yup.string().nullable(),
    brokerCompanyContact: yup.string().nullable(),
    brokerCompanyPhone: yup.string().nullable(),
    brokerCompanyMail: yup.string().email().nullable(),
    brokerReceipt: yup.string().nullable(),
    brokerDepartment: yup.string().nullable(),
    brokerValidityLimit: yup.date().nullable(),
    traderCompanyAddress: yup.string().nullable(),
    traderCompanyContact: yup.string().nullable(),
    traderCompanyPhone: yup.string().nullable(),
    traderCompanyMail: yup.string().email().nullable(),
    traderReceipt: yup.string().nullable(),
    traderDepartment: yup.string().nullable(),
    traderValidityLimit: yup.date().nullable()
  })
  .noUnknown(
    true,
    "Révision impossible, certains champs saisis ne sont pas modifiables"
  );

const temporaryStorageDetailSchema = yup
  .object({
    destinationCap: yup.string().nullable(),
    destinationProcessingOperation: yup
      .string()
      .oneOf(PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION)
      .nullable()
  })
  .noUnknown(
    true,
    "Révision impossible, certains champs saisis ne sont pas modifiables"
  );
