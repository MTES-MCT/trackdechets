import { Company, User, Bsdasri, BsdasriStatus } from "@prisma/client";

import { getFullUser } from "../users/database";

import { BsdasriSirets } from "./types";

import { NotFormContributor } from "../forms/errors";

import { UserInputError, ForbiddenError } from "apollo-server-express";
export class InvalidPublicationAttempt extends UserInputError {
  constructor(reason?: string) {
    super(`Vous ne pouvez pas publier ce bordereau.${reason ?? ""}`);
  }
}

function isDasriEmitter(user: { companies: Company[] }, dasri: BsdasriSirets) {
  if (!dasri.emitterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(dasri.emitterCompanySiret);
}

function isDasriRecipient(
  user: { companies: Company[] },
  dasri: BsdasriSirets
) {
  if (!dasri.destinationCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(dasri.destinationCompanySiret);
}

function isDasriTransporter(
  user: { companies: Company[] },
  dasri: BsdasriSirets
) {
  if (!dasri.transporterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(dasri.transporterCompanySiret);
}

export async function isDasriContributor(user: User, dasri: BsdasriSirets) {
  const fullUser = await getFullUser(user);

  return [
    isDasriEmitter,
    isDasriTransporter,
    isDasriRecipient
  ].some(isFormRole => isFormRole(fullUser, dasri));
}

export async function checkIsBsdasriContributor(
  user: User,
  dasri: BsdasriSirets,
  errorMsg: string
) {
  const isContributor = await isDasriContributor(user, dasri);

  if (!isContributor) {
    throw new NotFormContributor(errorMsg);
  }

  return true;
}
export async function checkIsBsdasriPublishable(
  user: User,
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
