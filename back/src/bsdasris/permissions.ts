import { User, Bsdasri, BsdasriStatus, BsdasriType } from "@prisma/client";

import { getCachedUserSiretOrVat } from "../common/redis/users";

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
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  const formSiretsOrVat = [
    dasri.emitterCompanySiret,
    dasri.transporterCompanySiret,
    dasri.transporterCompanyVatNumber,
    dasri.destinationCompanySiret,
    dasri.ecoOrganismeSiret
  ].filter(Boolean);

  return userCompaniesSiretOrVat.some(siret => formSiretsOrVat.includes(siret));
}

// Don't call directly in resolver to handle permissions
export async function isDasriInitialEmitterHelper(
  user: User,
  bsdasri: Bsdasri
) {
  const userCompaniesSiretOrVat = await getCachedUserSiretOrVat(user.id);

  return userCompaniesSiretOrVat.some(siret =>
    bsdasri.synthesisEmitterSirets.includes(siret)
  );
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

/**
 *
 * User can read :
 * - simple bsdasri on which is siret is present
 * - synthesis bsdasri which associates child dasris whose emitter is user
 */
export async function checkCanReadBsdasri(user: User, bsdasri: Bsdasri) {
  const isContributor = await isDasriContributorHelper(user, bsdasri);

  if (isContributor) {
    return true;
  }

  if (bsdasri.type === BsdasriType.SYNTHESIS) {
    const isInitialEmitter = await isDasriInitialEmitterHelper(user, bsdasri);
    if (isInitialEmitter) {
      return true;
    }
  }

  throw new NotFormContributor(
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );
}
export async function checkCanDeleteBsdasri(user: User, bsdasri: Bsdasri) {
  await checkIsBsdasriContributor(
    user,
    bsdasri,
    "Vous n'êtes pas autorisé à supprimer ce bordereau."
  );

  const isUserOnlySignatory = async () =>
    bsdasri.status === BsdasriStatus.SIGNED_BY_PRODUCER &&
    (await getCachedUserSiretOrVat(user.id)).includes(
      bsdasri.emitterCompanySiret
    );

  if (
    bsdasri.status !== BsdasriStatus.INITIAL &&
    !(await isUserOnlySignatory())
  ) {
    throw new ForbiddenError(
      "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés"
    );
  }

  // INITIAL dasris should not be synthesized or grouped, but let's keep a safeguard here
  if (!!bsdasri.synthesizedInId || !!bsdasri.groupedInId) {
    throw new ForbiddenError(
      "Ce bordereau est associé à un autre, il n'est pas supprimable"
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
