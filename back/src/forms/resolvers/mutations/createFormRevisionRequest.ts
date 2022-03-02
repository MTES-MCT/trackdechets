import {
  Form,
  Prisma,
  RevisionRequestStatus,
  Status,
  User,
  TemporaryStorageDetail
} from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import * as yup from "yup";
import {
  PROCESSING_OPERATIONS_CODES,
  WASTES_CODES
} from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  FormRevisionRequestContentInput,
  MutationCreateFormRevisionRequestArgs
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getFormOrFormNotFound } from "../../database";
import { flattenBsddRevisionRequestInput } from "../../form-converter";
import { checkCanRequestRevision } from "../../permissions";
import { getFormRepository } from "../../repository";
import {
  INVALID_PROCESSING_OPERATION,
  INVALID_SIRET_LENGTH,
  INVALID_WASTE_CODE
} from "../../errors";

export type RevisionRequestContent = Pick<
  Prisma.BsddRevisionRequestCreateInput,
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
  | "traderCompanyName"
  | "traderCompanySiret"
  | "traderCompanyAddress"
  | "traderCompanyContact"
  | "traderCompanyPhone"
  | "traderCompanyMail"
  | "traderReceipt"
  | "traderDepartment"
  | "traderValidityLimit"
  | "temporaryStorageDestinationCap"
  | "temporaryStorageDestinationProcessingOperation"
>;

export default async function createFormRevisionRequest(
  _,
  { input }: MutationCreateFormRevisionRequestArgs,
  context: GraphQLContext
) {
  const { formId, content, comment, authoringCompanySiret } = input;

  const user = checkIsAuthenticated(context);
  const existingBsdd = await getFormOrFormNotFound({ id: formId });

  const formRepository = getFormRepository(user);
  const { temporaryStorageDetail } = await formRepository.findFullFormById(
    formId
  );

  await checkIfUserCanRequestRevisionOnBsdd(
    user,
    existingBsdd,
    temporaryStorageDetail
  );

  const flatContent = await getFlatContent(content, existingBsdd);

  const authoringCompany = await getAuthoringCompany(
    user,
    existingBsdd,
    authoringCompanySiret
  );
  const approversSirets = await getApproversSirets(
    existingBsdd,
    flatContent,
    authoringCompany.siret,
    context.user
  );

  const bsddRevisionRequest = await formRepository.createRevisionRequest({
    bsdd: { connect: { id: existingBsdd.id } },
    ...flatContent,
    authoringCompany: { connect: { id: authoringCompany.id } },
    approvals: {
      create: approversSirets.map(approverSiret => ({ approverSiret }))
    },
    comment
  });

  return bsddRevisionRequest;
}

async function getAuthoringCompany(
  user: Express.User,
  bsdd: Form,
  authoringCompanySiret: string
) {
  const { temporaryStorageDetail } = await getFormRepository(
    user
  ).findFullFormById(bsdd.id);

  if (
    ![
      bsdd.emitterCompanySiret,
      bsdd.recipientCompanySiret,
      temporaryStorageDetail?.destinationCompanySiret
    ].includes(authoringCompanySiret)
  ) {
    throw new UserInputError(
      `Le SIRET "${authoringCompanySiret}" ne peut pas être auteur de la révision.`
    );
  }

  const userCompanies = await getUserCompanies(user.id);
  const authoringCompany = userCompanies.find(
    company => company.siret === authoringCompanySiret
  );

  if (!authoringCompany) {
    throw new UserInputError(
      `Vous n'avez pas les droits suffisants pour déclarer le SIRET "${authoringCompanySiret}" comme auteur de la révision.`
    );
  }

  return authoringCompany;
}

async function checkIfUserCanRequestRevisionOnBsdd(
  user: User,
  bsdd: Form,
  temporaryStorageDetail?: TemporaryStorageDetail
): Promise<void> {
  await checkCanRequestRevision(user, bsdd, temporaryStorageDetail);
  if (Status.DRAFT === bsdd.status || Status.SEALED === bsdd.status) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Vous pouvez le modifier directement, aucune signature bloquante n'a encore été apposée."
    );
  }

  if (Status.REFUSED === bsdd.status || bsdd.isDeleted) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été refusé ou supprimé."
    );
  }

  const unsettledRevisionRequestsOnBsdd = await getFormRepository(
    user
  ).countRevisionRequests({
    bsddId: bsdd.id,
    status: RevisionRequestStatus.PENDING
  });
  if (unsettledRevisionRequestsOnBsdd > 0) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Une autre révision est déjà en attente de validation."
    );
  }
}

async function getFlatContent(
  content: FormRevisionRequestContentInput,
  bsdd: Form
): Promise<RevisionRequestContent> {
  const flatContent = flattenBsddRevisionRequestInput(content);

  if (Object.keys(flatContent).length === 0) {
    throw new UserInputError(
      "Impossible de créer une révision sans modifications."
    );
  }

  if (
    bsdd.temporaryStorageDetailId == null &&
    hasTemporaryStorageUpdate(flatContent)
  ) {
    throw new UserInputError(
      "Impossible de réviser l'entreposage provisoire, ce bordereau n'est pas concerné."
    );
  }

  await bsddRevisionRequestSchema.validate(flatContent);

  return flatContent;
}

async function getApproversSirets(
  bsdd: Form,
  content: RevisionRequestContent,
  authoringCompanySiret: string,
  user: Express.User
) {
  const approvers = [
    bsdd.emitterCompanySiret,
    bsdd.traderCompanySiret,
    bsdd.recipientCompanySiret
  ];

  if (hasTemporaryStorageUpdate(content)) {
    const { temporaryStorageDetail } = await getFormRepository(
      user
    ).findFullFormById(bsdd.id);

    approvers.push(temporaryStorageDetail.destinationCompanySiret);
  }

  return approvers
    .filter(Boolean)
    .filter(siret => siret !== authoringCompanySiret);
}

function hasTemporaryStorageUpdate(content: RevisionRequestContent): boolean {
  return (
    content.temporaryStorageDestinationCap != null ||
    content.temporaryStorageDestinationProcessingOperation != null
  );
}

const bsddRevisionRequestSchema = yup
  .object({
    recipientCap: yup.string().nullable(),
    wasteDetailsCode: yup
      .string()
      .oneOf([...WASTES_CODES, "", null], INVALID_WASTE_CODE),
    wasteDetailsPop: yup.boolean().nullable(),
    quantityReceived: yup.number().min(0).nullable(),
    processingOperationDone: yup
      .string()
      .oneOf(PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION)
      .nullable(),
    brokerCompanyName: yup.string().nullable(),
    brokerCompanySiret: yup
      .string()
      .nullable()
      .matches(/^$|^\d{14}$/, {
        message: `Courtier: ${INVALID_SIRET_LENGTH}`
      }),
    brokerCompanyAddress: yup.string().nullable(),
    brokerCompanyContact: yup.string().nullable(),
    brokerCompanyPhone: yup.string().nullable(),
    brokerCompanyMail: yup.string().email().nullable(),
    brokerReceipt: yup.string().nullable(),
    brokerDepartment: yup.string().nullable(),
    brokerValidityLimit: yup.date().nullable(),
    traderCompanyName: yup.string().nullable(),
    traderCompanySiret: yup
      .string()
      .nullable()
      .matches(/^$|^\d{14}$/, {
        message: `Négociant: ${INVALID_SIRET_LENGTH}`
      }),
    traderCompanyAddress: yup.string().nullable(),
    traderCompanyContact: yup.string().nullable(),
    traderCompanyPhone: yup.string().nullable(),
    traderCompanyMail: yup.string().email().nullable(),
    traderReceipt: yup.string().nullable(),
    traderDepartment: yup.string().nullable(),
    traderValidityLimit: yup.date().nullable(),
    temporaryStorageDestinationCap: yup.string().nullable(),
    temporaryStorageDestinationProcessingOperation: yup
      .string()
      .oneOf(PROCESSING_OPERATIONS_CODES, INVALID_PROCESSING_OPERATION)
      .nullable()
  })
  .noUnknown(
    true,
    "Révision impossible, certains champs saisis ne sont pas modifiables"
  );
