import { Company, Form, User } from "@prisma/client";
import { ForbiddenError } from "apollo-server-express";
import prisma from "../prisma";
import { FormSirets } from "./types";
import { getFullUser } from "../users/database";
import { getFullForm } from "./database";
import { InvaliSecurityCode, NotFormContributor } from "./errors";

function isFormEmitter(user: { companies: Company[] }, form: FormSirets) {
  if (!form.emitterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.emitterCompanySiret);
}

function isFormRecipient(user: { companies: Company[] }, form: FormSirets) {
  if (!form.recipientCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.recipientCompanySiret);
}

function isFormTransporter(user: { companies: Company[] }, form: FormSirets) {
  if (!form.transporterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.transporterCompanySiret);
}

function isFormTrader(user: { companies: Company[] }, form: FormSirets) {
  if (!form.traderCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.traderCompanySiret);
}

function isFormEcoOrganisme(user: { companies: Company[] }, form: FormSirets) {
  if (!form.ecoOrganismeSiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.ecoOrganismeSiret);
}

function isFormDestinationAfterTempStorage(
  user: { companies: Company[] },
  form: FormSirets
) {
  if (!form.temporaryStorageDetail) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.temporaryStorageDetail.destinationCompanySiret);
}

function isFormTransporterAfterTempStorage(
  user: { companies: Company[] },
  form: FormSirets
) {
  if (!form.temporaryStorageDetail) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.temporaryStorageDetail.transporterCompanySiret);
}

function isFormMultiModalTransporter(
  user: { companies: Company[] },
  form: FormSirets
) {
  if (!form.transportSegments) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  const transportSegmentSirets = form.transportSegments.map(
    segment => segment.transporterCompanySiret
  );
  return transportSegmentSirets.some(s => sirets.includes(s));
}

export async function isFormContributor(user: User, form: FormSirets) {
  const fullUser = await getFullUser(user);
  return [
    isFormEmitter,
    isFormRecipient,
    isFormTrader,
    isFormTransporter,
    isFormEcoOrganisme,
    isFormTransporterAfterTempStorage,
    isFormDestinationAfterTempStorage,
    isFormMultiModalTransporter
  ].some(isFormRole => isFormRole(fullUser, form));
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
  const fullUser = await getFullUser(user);

  if (!isFormTransporter(fullUser, form)) {
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
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);

  const isAuthorized = [isFormRecipient, isFormEmitter].some(isFormRole =>
    isFormRole(fullUser, fullForm)
  );
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme envoyé"
    );
  }
  return true;
}

export async function checkCanSignedByTransporter(user: User, form: Form) {
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);
  const isAuthorized = [
    isFormTransporter,
    isFormTransporterAfterTempStorage
  ].some(isFormRole => isFormRole(fullUser, fullForm));

  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à signer ce bordereau pour le transport"
    );
  }
  return true;
}

export async function checkCanMarkAsReceived(user: User, form: Form) {
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);
  const isAuthorized = [
    isFormRecipient,
    isFormDestinationAfterTempStorage
  ].some(isFormRole => isFormRole(fullUser, fullForm));

  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à réceptionner ce bordereau"
    );
  }
  return true;
}

export async function checkCanMarkAsAccepted(user: User, form: Form) {
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);
  const isAuthorized = [
    isFormRecipient,
    isFormDestinationAfterTempStorage
  ].some(isFormRole => isFormRole(fullUser, fullForm));
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme accepté"
    );
  }
  return true;
}

export async function checkCanMarkAsProcessed(user: User, form: Form) {
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);
  const isAuthorized = [
    isFormRecipient,
    isFormDestinationAfterTempStorage
  ].some(isFormRole => isFormRole(fullUser, fullForm));
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme traité"
    );
  }
  return true;
}

export async function checkCanMarkAsTempStored(user: User, form: Form) {
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);

  const isAuthorized = isFormRecipient(fullUser, fullForm);
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme entreposé provisoirement"
    );
  }
  return true;
}

export async function checkCanMarkAsTempStorerAccepted(user: User, form: Form) {
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);

  const isAuthorized = isFormRecipient(fullUser, fullForm);
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce bordereau comme entreposé provisoirement"
    );
  }
  return true;
}

export async function checkCanMarkAsResealed(user: User, form: Form) {
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);

  const isAuthorized = isFormRecipient(fullUser, fullForm);
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à sceller ce bordereau après entreposage provisoire"
    );
  }
  return true;
}

export async function checkCanMarkAsResent(user: User, form: Form) {
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);

  const isAuthorized = isFormRecipient(fullUser, fullForm);
  if (!isAuthorized) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à marquer ce borderau comme envoyé après entreposage provisoire"
    );
  }
  return true;
}

// only recipient of the form can import data from paper
export async function checkCanImportForm(user: User, form: Form) {
  const fullUser = await getFullUser(user);
  const isAuthorized = isFormRecipient(fullUser, form);
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
