import {
  Form,
  Company,
  User,
  EcoOrganisme,
  TemporaryStorageDetail,
  TransportSegment,
  prisma
} from "../generated/prisma-client";
import { FullForm } from "./types";
import { NotFormContributor, InvaliSecurityCode } from "./errors";
import { getFullUser } from "../users/database";
import { FullUser } from "../users/types";
import { getFullForm } from "./database";
import { ForbiddenError } from "apollo-server-express";

function isFormOwner(user: User, form: { owner: User }) {
  return form.owner?.id === user.id;
}

function isFormEmitter(user: { companies: Company[] }, form: Form) {
  if (!form.emitterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.emitterCompanySiret);
}

function isFormRecipient(user: { companies: Company[] }, form: Form) {
  if (!form.recipientCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.recipientCompanySiret);
}

function isFormTransporter(user: { companies: Company[] }, form: Form) {
  if (!form.transporterCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.transporterCompanySiret);
}

function isFormTrader(user: { companies: Company[] }, form: Form) {
  if (!form.traderCompanySiret) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.traderCompanySiret);
}

function isFormEcoOrganisme(
  user: { companies: Company[] },
  form: { ecoOrganisme: EcoOrganisme }
) {
  if (!form.ecoOrganisme) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.ecoOrganisme.siret);
}

function isFormDestinationAfterTempStorage(
  user: { companies: Company[] },
  form: {
    temporaryStorage: TemporaryStorageDetail;
  }
) {
  if (!form.temporaryStorage) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.temporaryStorage.destinationCompanySiret);
}

function isFormTransporterAfterTempStorage(
  user: { companies: Company[] },
  form: {
    temporaryStorage: TemporaryStorageDetail;
  }
) {
  if (!form.temporaryStorage) {
    return false;
  }
  const sirets = user.companies.map(c => c.siret);
  return sirets.includes(form.temporaryStorage.transporterCompanySiret);
}

function isFormMultiModalTransporter(
  user: { companies: Company[] },
  form: { transportSegments: TransportSegment[] }
) {
  const sirets = user.companies.map(c => c.siret);
  const transportSegmentSirets = form.transportSegments.map(
    segment => segment.transporterCompanySiret
  );
  return transportSegmentSirets.some(s => sirets.includes(s));
}

export function isFormContributor(user: FullUser, form: FullForm) {
  return [
    isFormOwner,
    isFormEmitter,
    isFormRecipient,
    isFormTrader,
    isFormTransporter,
    isFormEcoOrganisme,
    isFormTransporterAfterTempStorage,
    isFormDestinationAfterTempStorage,
    isFormMultiModalTransporter
  ].some(isFormRole => isFormRole(user, form));
}

/**
 * Only users who belongs to a company that appears on the BSD
 * can read, update or delete it
 */
export async function checkCanReadUpdateDeleteForm(user: User, form: Form) {
  // user with companies
  const fullUser = await getFullUser(user);

  // form with linked objects (tempStorageDetail, transportSegment, owner, etc)
  const fullForm = await getFullForm(form);

  if (!isFormContributor(fullUser, fullForm)) {
    throw new NotFormContributor();
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

export async function checkSecurityCode(siret: string, securityCode: number) {
  const exists = await prisma.$exists.company({
    siret,
    securityCode
  });
  if (!exists) {
    throw new InvaliSecurityCode();
  }
  return true;
}
