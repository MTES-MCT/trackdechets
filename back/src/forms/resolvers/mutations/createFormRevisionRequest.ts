import {
  EmitterType,
  Form,
  OperationMode,
  Prisma,
  RevisionRequestStatus,
  Status,
  User
} from "@prisma/client";
import * as yup from "yup";
import {
  PROCESSING_AND_REUSE_OPERATIONS_CODES,
  BSDD_WASTE_CODES,
  BSDD_APPENDIX1_WASTE_CODES
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
import { ForbiddenError, UserInputError } from "../../../common/errors";
import { getOperationModesFromOperationCode } from "../../../common/operationModes";

// If you modify this, also modify it in the frontend
export const CANCELLABLE_BSDD_STATUSES: Status[] = [
  // Status.DRAFT,
  // Status.SEALED,
  Status.SIGNED_BY_PRODUCER,
  Status.SENT,
  // Status.RECEIVED,
  // Status.ACCEPTED,
  // Status.PROCESSED,
  // Status.FOLLOWED_WITH_PNTTD,
  // Status.AWAITING_GROUP,
  // Status.GROUPED,
  // Status.NO_TRACEABILITY,
  // Status.REFUSED,
  Status.TEMP_STORED,
  Status.TEMP_STORER_ACCEPTED,
  Status.RESEALED,
  Status.SIGNED_BY_TEMP_STORER,
  Status.RESENT
  // Status.CANCELED,
];

export const NON_CANCELLABLE_BSDD_STATUSES: Status[] = Object.values(
  Status
).filter(status => !CANCELLABLE_BSDD_STATUSES.includes(status));

export type RevisionRequestContent = Pick<
  Prisma.BsddRevisionRequestCreateInput,
  | "isCanceled"
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

  await checkIfUserCanRequestRevisionOnBsdd(user, existingBsdd);

  const flatContent = await getFlatContent(content, existingBsdd);

  const authoringCompany = await getAuthoringCompany(
    user,
    existingBsdd,
    authoringCompanySiret
  );
  const approversSirets = await getApproversSirets(
    existingBsdd,
    flatContent,
    authoringCompany.orgId,
    user
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
      bsdd.ecoOrganismeSiret,
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
  bsdd: Form
): Promise<void> {
  await checkCanRequestRevision(user, bsdd);
  if (bsdd.emitterIsPrivateIndividual || bsdd.emitterIsForeignShip) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau car l'émetteur est un particulier ou un navire étranger."
    );
  }
  if (bsdd.emitterType === EmitterType.APPENDIX1_PRODUCER) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur un bordereau d'annexe 1."
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

  if (bsdd.status === Status.CANCELED) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été annulé."
    );
  }

  const unsettledRevisionRequestsOnBsdd = await getFormRepository(
    user as Express.User
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

  const { isCanceled, ...revisionFields } = flatContent;

  if (!isCanceled && Object.keys(revisionFields).length === 0) {
    throw new UserInputError(
      "Impossible de créer une révision sans modifications."
    );
  }

  if (bsdd.forwardedInId == null && hasTemporaryStorageUpdate(flatContent)) {
    throw new UserInputError(
      "Impossible de réviser l'entreposage provisoire, ce bordereau n'est pas concerné."
    );
  }

  if (flatContent.isCanceled && Object.values(revisionFields).length > 0) {
    throw new UserInputError(
      "Impossible d'annuler et de modifier un bordereau."
    );
  }

  // One cannot request a CANCELATION if the BSDD has advanced too far in the workflow
  if (
    flatContent.isCanceled &&
    NON_CANCELLABLE_BSDD_STATUSES.includes(bsdd.status)
  ) {
    throw new ForbiddenError(
      "Impossible d'annuler un bordereau qui a été réceptionné sur l'installation de destination."
    );
  }

  await bsddRevisionRequestSchema.validate(flatContent);

  if (
    bsdd.emitterType === EmitterType.APPENDIX1 &&
    flatContent.wasteDetailsCode &&
    !BSDD_APPENDIX1_WASTE_CODES.includes(flatContent.wasteDetailsCode)
  ) {
    throw new ForbiddenError(
      "Impossible d'utiliser ce code déchet sur un bordereau de tournée d'annexe 1."
    );
  }

  return flatContent;
}

async function getApproversSirets(
  bsdd: Form,
  content: RevisionRequestContent,
  authoringCompanySiret: string,
  user: Express.User
) {
  // do not include emitter and ecoOrg sirets if authoring company is one of them
  const authoringCompanyIsEmitterOrEcoOrg = [
    bsdd.emitterCompanySiret,
    bsdd.ecoOrganismeSiret
  ].includes(authoringCompanySiret);

  const approvers = [
    ...(authoringCompanyIsEmitterOrEcoOrg
      ? []
      : [bsdd.emitterCompanySiret, bsdd.ecoOrganismeSiret]),
    bsdd.traderCompanySiret,
    bsdd.recipientCompanySiret
  ].filter(Boolean);

  if (hasTemporaryStorageUpdate(content)) {
    const forwardedIn = await getFormRepository(user).findForwardedInById(
      bsdd.id
    );

    if (forwardedIn?.recipientCompanySiret) {
      approvers.push(forwardedIn.recipientCompanySiret);
    }
  }

  const approversSirets = approvers.filter(
    siret => Boolean(siret) && siret !== authoringCompanySiret
  );

  // Remove duplicates
  return [...new Set(approversSirets)];
}

function hasTemporaryStorageUpdate(
  content: Pick<
    RevisionRequestContent,
    | "temporaryStorageDestinationCap"
    | "temporaryStorageDestinationProcessingOperation"
    | "temporaryStorageTemporaryStorerQuantityReceived"
  >
): boolean {
  return (
    content.temporaryStorageDestinationCap != null ||
    content.temporaryStorageDestinationProcessingOperation != null ||
    content.temporaryStorageTemporaryStorerQuantityReceived != null
  );
}

const bsddRevisionRequestSchema: yup.SchemaOf<RevisionRequestContent> = yup
  .object({
    isCanceled: yup.bool().transform(v => (v === null ? false : v)),
    recipientCap: yup.string().nullable(),
    wasteDetailsCode: yup
      .string()
      .oneOf([...BSDD_WASTE_CODES, "", null], INVALID_WASTE_CODE),
    wasteDetailsName: yup.string().nullable(),
    wasteDetailsPop: yup.boolean().nullable(),
    wasteDetailsPackagingInfos: yup
      .array()
      .of(packagingInfoFn({ isDraft: false }))
      .transform(v => (v === null ? Prisma.JsonNull : v)),
    quantityReceived: yup.number().min(0).nullable(),
    processingOperationDone: yup
      .string()
      .oneOf(
        PROCESSING_AND_REUSE_OPERATIONS_CODES,
        INVALID_PROCESSING_OPERATION
      )
      .nullable(),
    destinationOperationMode: yup
      .mixed<OperationMode | null | undefined>()
      .oneOf([...Object.values(OperationMode), null, undefined])
      .nullable()
      .test(
        "processing-mode-matches-processing-operation",
        "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie",
        function (item) {
          const { processingOperationDone } = this.parent;
          const destinationOperationMode = item;

          if (processingOperationDone && destinationOperationMode) {
            const modes = getOperationModesFromOperationCode(
              processingOperationDone
            );

            return modes.includes(destinationOperationMode ?? "");
          }

          return true;
        }
      ),
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
