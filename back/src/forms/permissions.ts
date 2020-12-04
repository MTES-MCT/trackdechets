import { Form, Company, User, prisma } from "../generated/prisma-client";
import { FormSirets } from "./types";
import { NotFormContributor, InvaliSecurityCode } from "./errors";
import { getFullUser } from "../users/database";
import { getFullForm } from "./database";
import { ForbiddenError } from "apollo-server-express";

function isFormOwner(user: User, form: { owner: User }) {
  return form.owner?.id === user.id;
}

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
 * Only owner of the form or users who belongs to a company that appears on the BSD
 * can read, update or delete it
 */
export async function checkCanReadUpdateDeleteForm(user: User, form: Form) {
  const fullForm = await getFullForm(form);

  const isContributor = await isFormContributor(user, fullForm);
  const isOwner = isFormOwner(user, fullForm);

  if (!isContributor && !isOwner) {
    throw new NotFormContributor(
      "Vous n'êtes pas autorisé à lire, modifier ou supprimer ce bordereau"
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
  const fullUser = await getFullUser(user);
  const fullForm = await getFullForm(form);
  const isAuthorized = [
    isFormOwner,
    isFormEcoOrganisme,
    isFormRecipient,
    isFormTransporter,
    isFormEmitter,
    isFormTrader,
    isFormDestinationAfterTempStorage
  ].some(isFormRole => isFormRole(fullUser, fullForm));
  if (!isAuthorized) {
    throw new ForbiddenError("Vous n'êtes pas autorisé à sceller ce bordereau");
  }
  return true;
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
  const exists = await prisma.$exists.company({ siret, securityCode });
  if (!exists) {
    throw new InvaliSecurityCode();
  }
  return true;
}
