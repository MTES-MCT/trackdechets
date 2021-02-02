import { Company, User } from "@prisma/client";

import { getFullUser } from "../users/database";

import { DasriSirets } from "./types";

import { NotFormContributor } from "../forms/errors";

function isDasriEmitter(user: { companies: Company[] }, dasri: DasriSirets) {
  if (!dasri.emitterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(dasri.emitterCompanySiret);
}

function isDasriRecipient(user: { companies: Company[] }, dasri: DasriSirets) {
  if (!dasri.recipientCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(dasri.recipientCompanySiret);
}

function isDasriTransporter(
  user: { companies: Company[] },
  dasri: DasriSirets
) {
  if (!dasri.transporterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(dasri.transporterCompanySiret);
}

export async function isDasriContributor(user: User, dasri: DasriSirets) {
  const fullUser = await getFullUser(user);

  return [
    isDasriEmitter,
    isDasriTransporter,
    isDasriRecipient
  ].some(isFormRole => isFormRole(fullUser, dasri));
}

export async function checkIsDasriContributor(
  user: User,
  dasri: DasriSirets,
  errorMsg: string
) {
  const isContributor = await isDasriContributor(user, dasri);

  if (!isContributor) {
    throw new NotFormContributor(errorMsg);
  }

  return true;
}
