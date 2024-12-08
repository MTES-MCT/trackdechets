import { Bspaoh as PrismaBspaoh, User, BspaohStatus } from "@prisma/client";
import type { BspaohInput } from "@td/codegen-back";

import { Permission, checkUserPermissions } from "../permissions";

/**
 * Retrieves organisations allowed to update, delete or duplicate an existing BSPAOH.
 * In case of update, this function can be called with an `updateInput`
 * parameter to pre-compute the form contributors after the update, hence verifying
 * a user is not removing his own company from the BSPAOH
 */
function contributors(bspaoh: PrismaBspaoh, input?: BspaohInput): string[] {
  const updateEmitterCompanySiret = input?.emitter?.company?.siret;
  const updateDestinationCompanySiret = input?.destination?.company?.siret;
  const updateTransporterCompanySiret = input?.transporter?.company?.siret;

  const emitterCompanySiret =
    updateEmitterCompanySiret !== undefined
      ? updateEmitterCompanySiret
      : bspaoh.emitterCompanySiret;

  const destinationCompanySiret =
    updateDestinationCompanySiret !== undefined
      ? updateDestinationCompanySiret
      : bspaoh.destinationCompanySiret;

  const transporterCompanySirets =
    updateTransporterCompanySiret !== undefined
      ? [updateTransporterCompanySiret]
      : bspaoh.transportersSirets;

  const contributors = [
    emitterCompanySiret,
    destinationCompanySiret,
    ...transporterCompanySirets
  ].filter(Boolean);

  if (bspaoh.status === BspaohStatus.DRAFT) {
    return bspaoh.canAccessDraftSirets.filter(siret =>
      contributors.includes(siret)
    );
  }

  return contributors;
}
/**
 * Retrieves organisations allowed to read a Bspaoh
 */
function readers(bspaoh: PrismaBspaoh): string[] {
  const readers = [
    bspaoh.emitterCompanySiret,
    bspaoh.destinationCompanySiret,
    ...bspaoh.transportersSirets
  ].filter(Boolean);

  if (bspaoh.status === BspaohStatus.DRAFT) {
    return bspaoh.canAccessDraftSirets.filter(siret => readers.includes(siret));
  }
  return readers;
}

export function checkCanRead(user: User, bspaoh: PrismaBspaoh) {
  if (user.isAdmin && user.isActive) {
    return true;
  }
  const authorizedOrgIds = readers(bspaoh);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRead,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );
}

export async function checkCanReadPdf(user: User, bspaoh: PrismaBspaoh) {
  const authorizedOrgIds: string[] = [...readers(bspaoh)];

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRead,
    "Vous n'êtes pas autorisé à accéder au récépissé PDF de ce BSPAOH."
  );
}
/**
 * Retrieves organisations allowed to create a Bspaoh of the given payload
 */
function creators(input: BspaohInput) {
  return [
    input?.emitter?.company?.siret,
    input?.transporter?.company?.siret,
    input?.destination?.company?.siret
  ].filter(Boolean);
}

export async function checkCanCreate(user: User, bspaohInput: BspaohInput) {
  const authorizedOrgIds = creators(bspaohInput);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Votre établissement doit être visé sur le bordereau"
  );
}

export async function checkCanUpdate(
  user: User,
  bspaoh: PrismaBspaoh,
  input?: BspaohInput
) {
  const authorizedOrgIds = contributors(bspaoh);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Votre établissement doit être visé sur le bordereau"
  );
  if (input) {
    const authorizedOrgIdsAfterUpdate = contributors(bspaoh, input);

    return checkUserPermissions(
      user,
      authorizedOrgIdsAfterUpdate,
      Permission.BsdCanUpdate,
      "Vous ne pouvez pas enlever votre établissement du bordereau"
    );
  }
  return true;
}

export async function checkCanDelete(user: User, bspaoh: PrismaBspaoh) {
  const draftOrInitial = [BspaohStatus.INITIAL, BspaohStatus.DRAFT].includes(
    bspaoh.status
  );

  let authorizedOrgIds: string[] = [];
  if (draftOrInitial) {
    authorizedOrgIds = [...contributors(bspaoh)];
  }
  if (bspaoh.status === BspaohStatus.SIGNED_BY_PRODUCER) {
    authorizedOrgIds = [bspaoh.emitterCompanySiret].filter(Boolean);
  }

  const errorMsg = draftOrInitial
    ? "Vous n'êtes pas autorisé à supprimer ce bordereau."
    : "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés";
  await checkUserPermissions(
    user,
    authorizedOrgIds.filter(Boolean),
    Permission.BsdCanDelete,
    errorMsg
  );

  return true;
}

export async function checkCanDuplicate(user: User, bspaoh: PrismaBspaoh) {
  const authorizedOrgIds = contributors(bspaoh);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas dupliquer un bordereau sur lequel votre entreprise n'apparait pas"
  );
}
