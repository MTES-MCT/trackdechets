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
  PROCESSING_AND_REUSE_OPERATIONS_CODES,
  BSDD_WASTE_CODES
} from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  FormRevisionRequestContentInput,
  MutationCreateFormRevisionRequestArgs
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getFormOrFormNotFound } from "../../database";
import { flattenBsddRevisionRequestInput } from "../../converter";
import { checkCanRequestRevision } from "../../permissions";
import { getFormRepository } from "../../repository";
import { INVALID_PROCESSING_OPERATION, INVALID_WASTE_CODE } from "../../errors";
import { packagingInfoFn } from "../../validation";
import { isSiret } from "../../../common/constants/companySearchHelpers";

export type RevisionRequestContent = Pick<
  Prisma.BsddRevisionRequestCreateInput,
  | "recipientCap"
  | "wasteDetailsCode"
  | "wasteDetailsName"
  | "wasteDetailsPop"
  | "wasteDetailsPackagingInfos"
  | "quantityReceived"
  | "processingOperationDone"
  | "processingOperationDescription"
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
  | "temporaryStorageTemporaryStorerQuantityReceived"
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
  const forwardedIn = await formRepository.findForwardedInById(formId);

  await checkIfUserCanRequestRevisionOnBsdd(user, existingBsdd, forwardedIn);

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

  return formRepository.createRevisionRequest({
    bsdd: { connect: { id: existingBsdd.id } },
    ...flatContent,
    authoringCompany: { connect: { id: authoringCompany.id } },
    approvals: {
      create: approversSirets.map(approverSiret => ({ approverSiret }))
    },
    comment
  });
}

async function getAuthoringCompany(
  user: Express.User,
  bsdd: Form,
  authoringCompanySiret: string
) {
  const forwardedIn = await getFormRepository(user).findForwardedInById(
    bsdd.id
  );

  if (
    ![
      bsdd.emitterCompanySiret,
      bsdd.recipientCompanySiret,
      forwardedIn?.recipientCompanySiret
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
  forwardedIn?: Form
): Promise<void> {
  await checkCanRequestRevision(user, bsdd, forwardedIn);
  if (bsdd.emitterIsPrivateIndividual || bsdd.emitterIsForeignShip) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau car l'émetteur est un particulier ou un navire étranger."
    );
  }
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

  if (bsdd.forwardedInId == null && hasTemporaryStorageUpdate(flatContent)) {
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
    const forwardedIn = await getFormRepository(user).findForwardedInById(
      bsdd.id
    );

    approvers.push(forwardedIn.recipientCompanySiret);
  }

  const approversSirets = approvers.filter(
    siret => Boolean(siret) && siret !== authoringCompanySiret
  );

  // Remove duplicates
  return [...new Set(approversSirets)];
}

function hasTemporaryStorageUpdate(content: RevisionRequestContent): boolean {
  return (
    content.temporaryStorageDestinationCap != null ||
    content.temporaryStorageDestinationProcessingOperation != null ||
    content.temporaryStorageTemporaryStorerQuantityReceived != null
  );
}

const bsddRevisionRequestSchema: yup.SchemaOf<RevisionRequestContent> = yup
  .object({
    recipientCap: yup.string().nullable(),
    wasteDetailsCode: yup
      .string()
      .oneOf([...BSDD_WASTE_CODES, "", null], INVALID_WASTE_CODE),
    wasteDetailsName: yup.string().nullable(),
    wasteDetailsPop: yup.boolean().nullable(),
    wasteDetailsPackagingInfos: yup
      .array()
      .of(packagingInfoFn(false))
      .nullable(),
    quantityReceived: yup.number().min(0).nullable(),
    processingOperationDone: yup
      .string()
      .oneOf(
        PROCESSING_AND_REUSE_OPERATIONS_CODES,
        INVALID_PROCESSING_OPERATION
      )
      .nullable(),
    processingOperationDescription: yup.string().nullable(),
    brokerCompanyName: yup.string().nullable(),
    brokerCompanySiret: yup
      .string()
      .nullable()
      .test(
        "is-siret",
        "Courtier: ${originalValue} n'est pas un numéro de SIRET valide",
        value => !value || isSiret(value)
      ),
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
      .test(
        "is-siret",
        "Négociant: ${originalValue} n'est pas un numéro de SIRET valide",
        value => !value || isSiret(value)
      ),
    traderCompanyAddress: yup.string().nullable(),
    traderCompanyContact: yup.string().nullable(),
    traderCompanyPhone: yup.string().nullable(),
    traderCompanyMail: yup.string().email().nullable(),
    traderReceipt: yup.string().nullable(),
    traderDepartment: yup.string().nullable(),
    traderValidityLimit: yup.date().nullable(),
    temporaryStorageDestinationCap: yup.string().nullable(),
    temporaryStorageTemporaryStorerQuantityReceived: yup
      .number()
      .min(0)
      .nullable(),
    temporaryStorageDestinationProcessingOperation: yup
      .string()
      .oneOf(
        PROCESSING_AND_REUSE_OPERATIONS_CODES,
        INVALID_PROCESSING_OPERATION
      )
      .nullable()
  })
  .noUnknown(
    true,
    "Révision impossible, certains champs saisis ne sont pas modifiables"
  );
