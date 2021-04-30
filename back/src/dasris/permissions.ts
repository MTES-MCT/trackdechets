import { Company, User, Bsdasri, BsdasriStatus } from "@prisma/client";

import { getFullUser } from "../users/database";

import { BsdasriSirets } from "./types";

import { NotFormContributor } from "../forms/errors";
import { getFullBsdasri } from "./database";
import { UserInputError } from "apollo-server-express";
export class InvalidPublicationAttempt extends UserInputError {
  constructor() {
    super("Vous ne pouvez pas publier ce bordereau.");
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
  if (!dasri.recipientCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(dasri.recipientCompanySiret);
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
export async function checkIsBsdasriPublishable(user: User, dasri: Bsdasri) {
  if (!dasri.isDraft || dasri.status !== BsdasriStatus.INITIAL) {
    throw new InvalidPublicationAttempt();
  }
  return true;
}
export async function checkCanReadBsdasri(user: User, bsdasri: Bsdasri) {
  return checkIsBsdasriContributor(
    user,

    await getFullBsdasri(bsdasri),
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );
}
