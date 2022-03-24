import { User, Bsdasri, BsdasriStatus } from "@prisma/client";

import { getCachedUserSirets } from "../common/redis/users";

import { BsdasriSirets } from "./types";

import { NotFormContributor } from "../forms/errors";

import { UserInputError, ForbiddenError } from "apollo-server-express";
export class InvalidPublicationAttempt extends UserInputError {
  constructor(reason?: string) {
    super(`Vous ne pouvez pas publier ce bordereau.${reason ?? ""}`);
  }
}

// Don't call directly in resolver to handle permissions
export async function isDasriContributorHelper(
  user: User,
  dasri: BsdasriSirets
) {
  const userSirets = await getCachedUserSirets(user.id);
  const formSirets = [
    dasri.emitterCompanySiret,
    dasri.transporterCompanySiret,
    dasri.destinationCompanySiret
  ].filter(Boolean);

  return userSirets.some(siret => formSirets.includes(siret));
}

export async function checkIsBsdasriContributor(
  user: User,
  dasri: BsdasriSirets,
  errorMsg: string
) {
  const isContributor = await isDasriContributorHelper(user, dasri);

  if (!isContributor) {
    throw new NotFormContributor(errorMsg);
  }

  return true;
}
export async function checkIsBsdasriPublishable(
  dasri: Bsdasri,
  grouping?: string[]
) {
  if (!dasri.isDraft || dasri.status !== BsdasriStatus.INITIAL) {
    throw new InvalidPublicationAttempt();
  }
  // This case shouldn't happen, but let's enforce the rules
  if (dasri.type === "GROUPING" && !grouping?.length) {
    throw new InvalidPublicationAttempt(
      "Un bordereau de regroupement doit comporter des bordereaux regroupés"
    );
  }

  return true;
}
export async function checkCanReadBsdasri(user: User, bsdasri: Bsdasri) {
  return checkIsBsdasriContributor(
    user,
    bsdasri,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );
}
export async function checkCanDeleteBsdasri(user: User, bsdasri: Bsdasri) {
  await checkIsBsdasriContributor(
    user,
    bsdasri,
    "Vous n'êtes pas autorisé à supprimer ce bordereau."
  );

  if (bsdasri.status !== BsdasriStatus.INITIAL) {
    throw new ForbiddenError(
      "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés"
    );
  }

  return true;
}

export function checkCanEditBsdasri(bsdasri: Bsdasri) {
  if (!!bsdasri.synthesizedInId)
    throw new ForbiddenError(
      "Ce bordereau est regroupé dans un bordereau de synthèse, il n'est pas modifiable, aucune signature ne peut y être apposée "
    );
  return true;
}
