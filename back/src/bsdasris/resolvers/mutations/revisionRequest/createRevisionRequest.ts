import {
  Bsdasri,
  BsdasriStatus,
  Prisma,
  RevisionRequestStatus
} from "@prisma/client";

import { ForbiddenError, UserInputError } from "../../../../common/errors";

import { checkIsAuthenticated } from "../../../../common/permissions";
import {
  BsdasriRevisionRequestContentInput,
  MutationCreateBsdasriRevisionRequestArgs
} from "@td/codegen-back";
import { GraphQLContext } from "../../../../types";
import { getUserCompanies } from "../../../../users/database";
import { flattenBsdasriRevisionRequestInput } from "../../../converter";
import { getBsdasriOrNotFound } from "../../../database";
import { checkCanRequestRevision } from "../../../permissions";
import { getBsdasriRepository } from "../../../repository";

import { revisionSchema, checkRevisionRules } from "../../../zodSchema";

// If you modify this, also modify it in the frontend
export const CANCELLABLE_BSDASRI_STATUSES: BsdasriStatus[] = [
  // BsdasriStatus.INITIAL,
  // BsdasriStatus.SIGNED_BY_PRODUCER,
  BsdasriStatus.SENT
  // BsdasriStatus.RECEIVED,
  // BsdasriStatus.PROCESSED,
  // BsdasriStatus.AWAITING_GROUP,
  // BsdasriStatus.CANCELED
  // BsdasriStatus.REFUSED,
  // BsdasriStatus.REFUSED_BY_RECIPIENT
];

export const NON_CANCELLABLE_BSDASRI_STATUSES: BsdasriStatus[] = Object.values(
  BsdasriStatus
).filter(status => !CANCELLABLE_BSDASRI_STATUSES.includes(status));

const BSDASRI_REVISION_REQUESTER_FIELDS = [
  "emitterCompanySiret",
  "destinationCompanySiret",
  "ecoOrganismeSiret"
];

export type RevisionRequestContent = Pick<
  Prisma.BsdasriRevisionRequestCreateInput,
  | "wasteCode"
  | "destinationWastePackagings"
  | "destinationReceptionWasteWeightValue"
  | "destinationOperationCode"
  | "emitterPickupSiteName"
  | "emitterPickupSiteAddress"
  | "emitterPickupSiteCity"
  | "emitterPickupSitePostalCode"
  | "emitterPickupSiteInfos"
>;

export async function createBsdasriRevisionRequest(
  _,
  { input }: MutationCreateBsdasriRevisionRequestArgs,
  context: GraphQLContext
) {
  const { bsdasriId, content, comment, authoringCompanySiret } = input;

  const user = checkIsAuthenticated(context);
  const bsdasri = await getBsdasriOrNotFound({ id: bsdasriId });

  const bsdasriRepository = getBsdasriRepository(user);

  await checkIfUserCanRequestRevisionOnBsdasri(user, bsdasri);
  const authoringCompany = await getAuthoringCompany(
    user,
    bsdasri,
    authoringCompanySiret
  );

  if (!authoringCompany.siret) {
    throw new Error(
      `Authoring company ${authoringCompany.id} has no siret. Cannot create BSDASRI revision request.`
    );
  }
  const approversSirets = await getApproversSirets(
    bsdasri,
    authoringCompany.siret
  );

  const flatContent = await getFlatContent(content, bsdasri);
  const history = getBsdasriHistory(bsdasri);

  return bsdasriRepository.createRevisionRequest({
    bsdasri: { connect: { id: bsdasri.id } },
    ...flatContent,
    authoringCompany: { connect: { id: authoringCompany.id } },
    approvals: {
      create: approversSirets.map(approverSiret => ({ approverSiret }))
    },
    comment,
    ...history
  });
}

async function checkIfUserCanRequestRevisionOnBsdasri(
  user: Express.User,
  bsdasri: Bsdasri
): Promise<void> {
  await checkCanRequestRevision(user, bsdasri);

  if (bsdasri.groupedInId || bsdasri.synthesizedInId) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur un bordereau inclus dans une synthèse ou un groupement."
    );
  }
  if (bsdasri.status === BsdasriStatus.INITIAL) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Vous pouvez le modifier directement, aucune signature bloquante n'a encore été apposée."
    );
  }

  if (bsdasri.status === BsdasriStatus.REFUSED || bsdasri.isDeleted) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été refusé ou supprimé."
    );
  }

  if (bsdasri.status === BsdasriStatus.CANCELED) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été annulé."
    );
  }

  const unsettledRevisionRequestsOnbsdasri = await getBsdasriRepository(
    user
  ).countRevisionRequests({
    bsdasriId: bsdasri.id,
    status: RevisionRequestStatus.PENDING
  });
  if (unsettledRevisionRequestsOnbsdasri > 0) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Une autre révision est déjà en attente de validation."
    );
  }
}

async function getApproversSirets(
  bsdasri: Bsdasri,
  authoringCompanySiret: string
) {
  // Requesters and approvers are the same persona
  const approversSirets = BSDASRI_REVISION_REQUESTER_FIELDS.map(
    field => bsdasri[field]
  ).filter(siret => Boolean(siret) && siret !== authoringCompanySiret);

  // Remove duplicates
  return [...new Set(approversSirets)];
}

async function getAuthoringCompany(
  user: Express.User,
  bsdasri: Bsdasri,
  authoringCompanySiret: string
) {
  const siretConcernedByRevision = BSDASRI_REVISION_REQUESTER_FIELDS.map(
    field => bsdasri[field]
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
  content: BsdasriRevisionRequestContentInput,
  bsdasri: Bsdasri
): Promise<RevisionRequestContent> {
  const flatContent = flattenBsdasriRevisionRequestInput(content);
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

  // One cannot request a CANCELATION if the dasri has advanced too far in the workflow
  if (isCanceled && NON_CANCELLABLE_BSDASRI_STATUSES.includes(bsdasri.status)) {
    throw new ForbiddenError(
      "Impossible d'annuler un bordereau qui a été réceptionné sur l'installation de destination."
    );
  }
  revisionSchema.parse(flatContent); // Validate but don't parse as we want to keep empty fields empty

  checkRevisionRules(fields, bsdasri);

  return flatContent;
}

function getBsdasriHistory(bsdasri: Bsdasri) {
  return {
    initialWasteCode: bsdasri.wasteCode,
    initialDestinationWastePackagings:
      bsdasri.destinationWastePackagings as Prisma.InputJsonValue,
    initialDestinationReceptionWasteWeightValue:
      bsdasri.destinationReceptionWasteWeightValue,
    initialDestinationOperationCode: bsdasri.destinationOperationCode,
    initialDestinationOperationMode: bsdasri.destinationOperationMode,
    initialEmitterPickupSiteName: bsdasri.emitterPickupSiteName,
    initialEmitterPickupSiteAddress: bsdasri.emitterPickupSiteAddress,
    initialEmitterPickupSiteCity: bsdasri.emitterPickupSiteCity,
    initialEmitterPickupSitePostalCode: bsdasri.emitterPickupSitePostalCode,
    initialEmitterPickupSiteInfos: bsdasri.emitterPickupSiteInfos
  };
}
