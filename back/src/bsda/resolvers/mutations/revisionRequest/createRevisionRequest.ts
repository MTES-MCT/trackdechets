import {
  Bsda,
  BsdaStatus,
  Prisma,
  RevisionRequestStatus
} from "@prisma/client";
import { z } from "zod";
import { ForbiddenError, UserInputError } from "../../../../common/errors";
import { getOperationModesFromOperationCode } from "../../../../common/operationModes";
import { checkIsAuthenticated } from "../../../../common/permissions";
import {
  BsdaRevisionRequestContentInput,
  MutationCreateBsdaRevisionRequestArgs
} from "../../../../generated/graphql/types";
import { GraphQLContext } from "../../../../types";
import { getUserCompanies } from "../../../../users/database";
import { flattenBsdaRevisionRequestInput } from "../../../converter";
import { getBsdaOrNotFound } from "../../../database";
import { checkCanRequestRevision } from "../../../permissions";
import { getBsdaRepository } from "../../../repository";
import { rawBsdaSchema } from "../../../validation/schema";

// If you modify this, also modify it in the frontend
export const CANCELLABLE_BSDA_STATUSES: BsdaStatus[] = [
  // BsdaStatus.INITIAL,
  // BsdaStatus.SIGNED_BY_PRODUCER,
  BsdaStatus.SIGNED_BY_WORKER,
  BsdaStatus.SENT
  // BsdaStatus.PROCESSED,
  // BsdaStatus.REFUSED,
  // BsdaStatus.AWAITING_CHILD,
  // BsdaStatus.CANCELED,
];

export const NON_CANCELLABLE_BSDA_STATUSES: BsdaStatus[] = Object.values(
  BsdaStatus
).filter(status => !CANCELLABLE_BSDA_STATUSES.includes(status));

const BSDA_REVISION_REQUESTER_FIELDS = [
  "emitterCompanySiret",
  "destinationCompanySiret",
  "workerCompanySiret"
];

export type RevisionRequestContent = Pick<
  Prisma.BsdaRevisionRequestCreateInput,
  | "wasteCode"
  | "wastePop"
  | "packagings"
  | "wasteSealNumbers"
  | "wasteMaterialName"
  | "destinationCap"
  | "destinationReceptionWeight"
  | "destinationOperationCode"
  | "destinationOperationDescription"
  | "brokerCompanyName"
  | "brokerCompanySiret"
  | "brokerCompanyAddress"
  | "brokerCompanyContact"
  | "brokerCompanyPhone"
  | "brokerCompanyMail"
  | "brokerRecepisseNumber"
  | "brokerRecepisseDepartment"
  | "brokerRecepisseValidityLimit"
  | "emitterPickupSiteName"
  | "emitterPickupSiteAddress"
  | "emitterPickupSiteCity"
  | "emitterPickupSitePostalCode"
  | "emitterPickupSiteInfos"
  | "isCanceled"
>;

export async function createBsdaRevisionRequest(
  _,
  { input }: MutationCreateBsdaRevisionRequestArgs,
  context: GraphQLContext
) {
  const { bsdaId, content, comment, authoringCompanySiret } = input;

  const user = checkIsAuthenticated(context);
  const bsda = await getBsdaOrNotFound(bsdaId);

  const bsdaRepository = getBsdaRepository(user);

  await checkIfUserCanRequestRevisionOnBsda(user, bsda);
  const authoringCompany = await getAuthoringCompany(
    user,
    bsda,
    authoringCompanySiret
  );

  if (!authoringCompany.siret) {
    throw new Error(
      `Authoring company ${authoringCompany.id} has no siret. Cannot create BSDA revision request.`
    );
  }
  const approversSirets = await getApproversSirets(
    bsda,
    authoringCompany.siret
  );

  const flatContent = await getFlatContent(content, bsda);

  return bsdaRepository.createRevisionRequest({
    bsda: { connect: { id: bsda.id } },
    ...flatContent,
    authoringCompany: { connect: { id: authoringCompany.id } },
    approvals: {
      create: approversSirets.map(approverSiret => ({ approverSiret }))
    },
    comment
  });
}

async function checkIfUserCanRequestRevisionOnBsda(
  user: Express.User,
  bsda: Bsda
): Promise<void> {
  await checkCanRequestRevision(user, bsda);

  if (bsda.status === BsdaStatus.INITIAL) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Vous pouvez le modifier directement, aucune signature bloquante n'a encore été apposée."
    );
  }

  if (bsda.status === BsdaStatus.REFUSED || bsda.isDeleted) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été refusé ou supprimé."
    );
  }

  if (bsda.status === BsdaStatus.CANCELED) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été annulé."
    );
  }

  const unsettledRevisionRequestsOnbsda = await getBsdaRepository(
    user
  ).countRevisionRequests({
    bsdaId: bsda.id,
    status: RevisionRequestStatus.PENDING
  });
  if (unsettledRevisionRequestsOnbsda > 0) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Une autre révision est déjà en attente de validation."
    );
  }
}

async function getApproversSirets(bsda: Bsda, authoringCompanySiret: string) {
  // Requesters and approvers are the same persona
  const approversSirets = BSDA_REVISION_REQUESTER_FIELDS.map(
    field => bsda[field]
  ).filter(siret => Boolean(siret) && siret !== authoringCompanySiret);

  // Remove duplicates
  return [...new Set(approversSirets)];
}

async function getAuthoringCompany(
  user: Express.User,
  bsda: Bsda,
  authoringCompanySiret: string
) {
  const siretConcernedByRevision = BSDA_REVISION_REQUESTER_FIELDS.map(
    field => bsda[field]
  );

  if (!siretConcernedByRevision.includes(authoringCompanySiret)) {
    throw new UserInputError(
      `Le SIRET "${authoringCompanySiret}" ne peut pas être auteur de la révision. Il n'apparait pas avec un rôle lui donnant ce droit sur le bordereau.`
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

async function getFlatContent(
  content: BsdaRevisionRequestContentInput,
  bsda: Bsda
): Promise<RevisionRequestContent> {
  const flatContent = flattenBsdaRevisionRequestInput(content);
  const { isCanceled, ...fields } = flatContent;

  if (!isCanceled && Object.keys(fields).length === 0) {
    throw new UserInputError(
      "Impossible de créer une révision sans modifications."
    );
  }

  if (isCanceled && Object.values(fields).length > 0) {
    throw new UserInputError(
      "Impossible d'annuler et de modifier un bordereau."
    );
  }

  // One cannot request a CANCELATION if the BSDA has advanced too far in the workflow
  if (isCanceled && NON_CANCELLABLE_BSDA_STATUSES.includes(bsda.status)) {
    throw new ForbiddenError(
      "Impossible d'annuler un bordereau qui a été réceptionné sur l'installation de destination."
    );
  }

  schema.parse(flatContent); // Validate but don't parse as we want to keep empty fields empty

  return flatContent;
}

const schema = rawBsdaSchema
  .pick({
    wasteCode: true,
    wastePop: true,
    wasteSealNumbers: true,
    wasteMaterialName: true,
    packagings: true,
    destinationCap: true,
    destinationOperationCode: true,
    destinationOperationMode: true,
    destinationOperationDescription: true,
    destinationReceptionWeight: true,
    brokerCompanyName: true,
    brokerCompanySiret: true,
    brokerCompanyAddress: true,
    brokerCompanyContact: true,
    brokerCompanyPhone: true,
    brokerCompanyMail: true,
    brokerRecepisseNumber: true,
    brokerRecepisseDepartment: true,
    brokerRecepisseValidityLimit: true,
    emitterPickupSiteName: true,
    emitterPickupSiteAddress: true,
    emitterPickupSiteCity: true,
    emitterPickupSitePostalCode: true,
    emitterPickupSiteInfos: true
  })
  .merge(z.object({ isCanceled: z.boolean().nullish() }))
  .superRefine((val, ctx) => {
    const { destinationOperationCode, destinationOperationMode } = val;
    if (destinationOperationCode) {
      const modes = getOperationModesFromOperationCode(
        destinationOperationCode
      );

      if (modes.length && !destinationOperationMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vous devez préciser un mode de traitement"
        });
      } else if (
        (modes.length &&
          destinationOperationMode &&
          !modes.includes(destinationOperationMode)) ||
        (!modes.length && destinationOperationMode)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
        });
      }
    }
  });
