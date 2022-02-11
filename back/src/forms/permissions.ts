import { Form, User, TemporaryStorageDetail } from "@prisma/client";
import { ForbiddenError } from "apollo-server-express";
import prisma from "../prisma";
import { FormSirets } from "./types";

import { getCachedUserSirets } from "../common/redis/users";

import { getFullForm } from "./database";
import { InvaliSecurityCode, NotFormContributor } from "./errors";

function isFormEmitter(userSirets: string[], form: FormSirets) {
  if (!form.emitterCompanySiret) {
    return false;
  }

  return userSirets.includes(form.emitterCompanySiret);
}

function isFormRecipient(userSirets: string[], form: FormSirets) {
  if (!form.recipientCompanySiret) {
    return false;
  }

  return userSirets.includes(form.recipientCompanySiret);
}

function isFormTransporter(userSirets: string[], form: FormSirets) {
  if (!form.transporterCompanySiret) {
    return false;
  }

  return userSirets.includes(form.transporterCompanySiret);
}

function isFormTrader(userSirets: string[], form: FormSirets) {
  if (!form.traderCompanySiret) {
    return false;
  }

  return userSirets.includes(form.traderCompanySiret);
}

function isFormBroker(userSirets: string[], form: FormSirets) {
  if (!form.brokerCompanySiret) {
    return false;
  }

  return userSirets.includes(form.brokerCompanySiret);
}

function isFormEcoOrganisme(userSirets: string[], form: FormSirets) {
  if (!form.ecoOrganismeSiret) {
    return false;
  }

  return userSirets.includes(form.ecoOrganismeSiret);
}

function isFormDestinationAfterTempStorage(
  userSirets: string[],
  form: FormSirets
) {
  if (!form.temporaryStorageDetail) {
    return false;
  }

  return userSirets.includes(
    form.temporaryStorageDetail.destinationCompanySiret
  );
}

function isFormTransporterAfterTempStorage(
  userSirets: string[],
  form: FormSirets
) {
  if (!form.temporaryStorageDetail) {
    return false;
  }

  return userSirets.includes(
    form.temporaryStorageDetail.transporterCompanySiret
  );
}

function isFormMultiModalTransporter(userSirets: string[], form: FormSirets) {
  if (!form.transportSegments) {
    return false;
  }

  const transportSegmentSirets = form.transportSegments.map(
    segment => segment.transporterCompanySiret
  );
  return transportSegmentSirets.some(s => userSirets.includes(s));
}

export async function isFormContributor(user: User, form: FormSirets) {
  const userSirets = await getCachedUserSirets(user.id);

  return [
    isFormEmitter,
    isFormRecipient,
    isFormTrader,
    isFormBroker,
    isFormTransporter,
    isFormEcoOrganisme,
    isFormTransporterAfterTempStorage,
    isFormDestinationAfterTempStorage,
    isFormMultiModalTransporter
  ].some(isFormRole => isFormRole(userSirets, form));
}

/**
 * Check that at least one of user's company is present somewhere in the form
 * or throw a ForbiddenError
 * */
export async function checkIsFormContributor(
  user: User,
  form: FormSirets,
  errorMsg: string
) {
  const isContributor = await isFormContributor(user, form);

  if (!isContributor) {
    throw new NotFormContributor(errorMsg);
  }

  return true;
}

export async function checkCanRead(user: User, form: Form) {
  return checkIsFormContributor(
    user,
    await getFullForm(form),
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );
}

export async function checkCanDuplicate(user: User, form: Form) {
  return checkIsFormContributor(
    user,
    await getFullForm(form),
    "Vous n'êtes pas autorisé à dupliquer ce bordereau"
  );
}

export async function checkCanUpdate(user: User, form: Form) {
  await checkIsFormContributor(
    user,
    await getFullForm(form),
    "Vous n'êtes pas autorisé à modifier ce bordereau"
  );
  if (!["DRAFT", "SEALED"].includes(form.status)) {
    throw new ForbiddenError(
      "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être modifiés"
    );
  }

  return true;
}

export async function checkCanDelete(user: User, form: Form) {
  await checkIsFormContributor(
    user,
    await getFullForm(form),
    "Vous n'êtes pas autorisé à supprimer ce bordereau"
  );

  if (!["DRAFT", "SEALED"].includes(form.status)) {
    throw new ForbiddenError(
      "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés"
    );
  }

  return true;
}

export async function checkCanUpdateTransporterFields(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  if (!isFormTransporter(userSirets, form)) {
    throw new ForbiddenError("Vous n'êtes pas transporteur de ce bordereau.");
  }
}

export async function checkCanMarkAsSealed(user: User, form: Form) {
  return checkIsFormContributor(
    user,
    await getFullForm(form),
    "Vous n'êtes pas autorisé à sceller ce bordereau"
  );
}

export async function checkCanMarkAsSent(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);

  const fullForm = await getFullForm(form);

  const isAuthorized = [isFormRecipient, isFormEmitter].some(isFormRole =>
    isFormRole(userSirets, fullForm)
  );
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme envoyé"
    );
  }
  return true;
}

export async function checkCanSignFor(
  siret: string,
  user: User,
  securityCode?: number
) {
  const userSirets = await getCachedUserSirets(user.id);

  if (userSirets.includes(siret)) {
    return true;
  }

  if (securityCode) {
    return checkSecurityCode(siret, securityCode);
  }

  throw new ForbiddenError(
    "Vous n'êtes pas autorisé à signer ce bordereau pour cet acteur"
  );
}

export async function checkCanSignedByTransporter(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  const fullForm = await getFullForm(form);
  const isAuthorized = [
    isFormTransporter,
    isFormTransporterAfterTempStorage
  ].some(isFormRole => isFormRole(userSirets, fullForm));

  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à signer ce bordereau pour le transport"
    );
  }
  return true;
}

export async function checkCanMarkAsReceived(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  const fullForm = await getFullForm(form);
  const isAuthorized = [
    isFormRecipient,
    isFormDestinationAfterTempStorage
  ].some(isFormRole => isFormRole(userSirets, fullForm));

  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à réceptionner ce bordereau"
    );
  }
  return true;
}

export async function checkCanMarkAsAccepted(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  const fullForm = await getFullForm(form);
  const isAuthorized = [
    isFormRecipient,
    isFormDestinationAfterTempStorage
  ].some(isFormRole => isFormRole(userSirets, fullForm));
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme accepté"
    );
  }
  return true;
}

export async function checkCanMarkAsProcessed(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  const fullForm = await getFullForm(form);
  const isAuthorized = [
    isFormRecipient,
    isFormDestinationAfterTempStorage
  ].some(isFormRole => isFormRole(userSirets, fullForm));
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme traité"
    );
  }
  return true;
}

export async function checkCanMarkAsTempStored(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  const fullForm = await getFullForm(form);

  const isAuthorized = isFormRecipient(userSirets, fullForm);
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme entreposé provisoirement"
    );
  }
  return true;
}

export async function checkCanMarkAsTempStorerAccepted(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  const fullForm = await getFullForm(form);

  const isAuthorized = isFormRecipient(userSirets, fullForm);
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme entreposé provisoirement"
    );
  }
  return true;
}

export async function checkCanMarkAsResealed(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  const fullForm = await getFullForm(form);

  const isAuthorized = isFormRecipient(userSirets, fullForm);
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à sceller ce bordereau après entreposage provisoire"
    );
  }
  return true;
}

export async function checkCanMarkAsResent(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  const fullForm = await getFullForm(form);

  const isAuthorized = isFormRecipient(userSirets, fullForm);
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce borderau comme envoyé après entreposage provisoire"
    );
  }
  return true;
}

// only recipient of the form can import data from paper
export async function checkCanImportForm(user: User, form: Form) {
  const userSirets = await getCachedUserSirets(user.id);
  const isAuthorized = isFormRecipient(userSirets, form);
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous devez apparaitre en tant que destinataire du bordereau (case 2) pour pouvoir mettre à jour ce bordereau"
    );
  }
  return true;
}

export async function checkSecurityCode(siret: string, securityCode: number) {
  const exists = await prisma.company.findFirst({
    where: { siret, securityCode }
  });
  if (!exists) {
    throw new InvaliSecurityCode();
  }
  return true;
}

export async function checkCanRequestRevision(
  user: User,
  form: Form,
  temporaryStorageDetail?: TemporaryStorageDetail
) {
  const userSirets = await getCachedUserSirets(user.id);

  const canRequestRevision = [
    isFormEmitter,
    isFormRecipient,
    isFormDestinationAfterTempStorage
  ].some(isFormRole =>
    isFormRole(userSirets, { ...form, temporaryStorageDetail })
  );

  if (!canRequestRevision) {
    throw new NotFormContributor(
      "Vous n'êtes pas autorisé à réviser ce bordereau"
    );
  }

  return true;
}
