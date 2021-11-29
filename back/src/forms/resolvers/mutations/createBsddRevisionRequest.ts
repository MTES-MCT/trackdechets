import {
  Form,
  Prisma,
  RevisionRequestStatus,
  Status,
  User
} from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import * as yup from "yup";
import {
  PROCESSING_OPERATIONS_CODES,
  WASTES_CODES
} from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsddRevisionRequestContentInput,
  MutationCreateBsddRevisionRequestArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getFormOrFormNotFound } from "../../database";
import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../form-converter";
import { checkCanRequestRevision } from "../../permissions";
import {
  INVALID_PROCESSING_OPERATION,
  INVALID_SIRET_LENGTH,
  INVALID_WASTE_CODE
} from "../../validation";

export type RevisionRequestContent = Pick<
  Prisma.FormCreateInput,
  | "recipientCap"
  | "wasteDetailsCode"
  | "wasteDetailsPop"
  | "quantityReceived"
  | "processingOperationDone"
  | "brokerCompanyName"
  | "brokerCompanySiret"
  | "brokerCompanyAddress"
  | "brokerCompanyContact"
  | "brokerCompanyPhone"
  | "brokerCompanyMail"
  | "brokerReceipt"
  | "brokerDepartment"
  | "brokerValidityLimit"
  | "traderCompanyAddress"
  | "traderCompanyContact"
  | "traderCompanyPhone"
  | "traderCompanyMail"
  | "traderReceipt"
  | "traderDepartment"
  | "traderValidityLimit"
> & {
  temporaryStorageDetail?: Pick<
    Prisma.TemporaryStorageDetailCreateInput,
    "destinationCap" | "destinationProcessingOperation"
  >;
};

export default async function createBsddRevisionRequest(
  _,
  { bsddId, content, comment }: MutationCreateBsddRevisionRequestArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const existingBsdd = await getFormOrFormNotFound({ id: bsddId });
  await checkIfUserCanRequestRevisionOnBsdd(user, existingBsdd);

  const flatContent = await getFlatContent(content, existingBsdd);

  const author = await getAuthorCompany(user.id, existingBsdd);
  const approversSirets = await getApproversSirets(
    existingBsdd,
    flatContent,
    author.siret
  );

  return prisma.bsddRevisionRequest.create({
    data: {
      bsdd: { connect: { id: existingBsdd.id } },
      content: JSON.parse(JSON.stringify(flatContent)),
      author: { connect: { id: author.id } },
      approvals: {
        create: approversSirets.map(approverSiret => ({ approverSiret }))
      },
      comment
    }
  });
}

async function getAuthorCompany(userId: string, bsdd: Form) {
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

async function checkIfUserCanRequestRevisionOnBsdd(
  user: User,
  bsdd: Form
): Promise<void> {
  await checkCanRequestRevision(user, bsdd);

  if (Status.DRAFT === bsdd.status || Status.SEALED === bsdd.status) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Vous pouvez le modifier directement, aucune signature bloquante n'a encore été apposée."
    );
  }

  const unsettledRevisionRequestsOnBsdd =
    await prisma.bsddRevisionRequest.count({
      where: {
        bsddId: bsdd.id,
        status: RevisionRequestStatus.PENDING
      }
    });
  if (unsettledRevisionRequestsOnBsdd > 0) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Une autre révision est déjà en attente de validation."
    );
  }
}

async function getFlatContent(
  content: BsddRevisionRequestContentInput,
  bsdd: Form
): Promise<RevisionRequestContent> {
  const { temporaryStorageDetail, ...bsddInput } = content;
  if (temporaryStorageDetail && bsdd.temporaryStorageDetailId == null) {
    throw new UserInputError(
      "Impossible de réviser l'entreposage provisoire, ce bordereau n'est pas concerné."
    );
  }
  const revisionRequestContent: RevisionRequestContent =
    flattenFormInput(bsddInput);
  await bsddRevisionRequestSchema.validate(revisionRequestContent);

  if (temporaryStorageDetail) {
    const temporaryStorageReviewContent = flattenTemporaryStorageDetailInput(
      temporaryStorageDetail
    );
    await temporaryStorageRevisionRequestSchema.validate(
      temporaryStorageReviewContent
    );
    revisionRequestContent.temporaryStorageDetail =
      temporaryStorageReviewContent;
  }

  return revisionRequestContent;
}

async function getApproversSirets(
  bsdd: Form,
  content: RevisionRequestContent,
  revisionAuthorSiret: string
) {
  const approvers = [
    bsdd.emitterCompanySiret,
    bsdd.traderCompanySiret,
    bsdd.recipientCompanySiret
  ];

  if (content.temporaryStorageDetail) {
    const temporaryStorageDetail = await prisma.form
      .findUnique({ where: { id: bsdd.id } })
      .temporaryStorageDetail();

    approvers.push(temporaryStorageDetail.destinationCompanySiret);
  }

  return approvers
    .filter(Boolean)
    .filter(siret => siret !== revisionAuthorSiret);
}

const bsddRevisionRequestSchema = yup
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

const temporaryStorageRevisionRequestSchema = yup
  .object({
    destinationCap: yup.string().nullable(),
    destinationProcessingOperation: yup
      .string()
      .oneOf(PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION)
      .nullable()
  })
  .noUnknown(
    true,
    "Révision impossible, certains champs saisis pour l'entreposage provisioire ne sont pas modifiables"
  );
