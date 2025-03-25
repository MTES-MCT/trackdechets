import { Bsdasri, BsdasriStatus, User } from "@prisma/client";
import type { BsdasriInput } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../permissions";
import { ForbiddenError, UserInputError } from "../common/errors";

/**
 * Retrieves organisations allowed to read a BSDASRI
 */
function readers(bsdasri: Bsdasri): string[] {
  return bsdasri.isDraft
    ? [...bsdasri.canAccessDraftOrgIds]
    : [
        bsdasri.emitterCompanySiret,
        bsdasri.transporterCompanySiret,
        bsdasri.transporterCompanyVatNumber,
        bsdasri.destinationCompanySiret,
        bsdasri.ecoOrganismeSiret,
        ...bsdasri.synthesisEmitterSirets,
        ...bsdasri.groupingEmitterSirets
      ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to update, delete or duplicate an existing BSDASRI.
 * In case of update, this function can be called with an `updateInput`
 * parameter to pre-compute the form contributors after the update, hence verifying
 * a user is not removing his own company from the BSDASRI
 */
function contributors(bsdasri: Bsdasri, input?: BsdasriInput) {
  if (bsdasri.isDraft) {
    return [...bsdasri.canAccessDraftOrgIds];
  }
  const updateEmitterCompanySiret = input?.emitter?.company?.siret;
  const updateTransporterCompanySiret = input?.transporter?.company?.siret;
  const updateTransporterCompanyVatNumber =
    input?.transporter?.company?.vatNumber;
  const updatedDestinationCompanySiret = input?.destination?.company?.siret;
  const updateEcoOrgansimeSiret = input?.ecoOrganisme?.siret;

  const emitterCompanySiret =
    updateEmitterCompanySiret !== undefined
      ? updateEmitterCompanySiret
      : bsdasri.emitterCompanySiret;

  const transporterCompanySiret =
    updateTransporterCompanySiret !== undefined
      ? updateTransporterCompanySiret
      : bsdasri.transporterCompanySiret;

  const transporterCompanyVatNumber =
    updateTransporterCompanyVatNumber !== undefined
      ? updateTransporterCompanyVatNumber
      : bsdasri.transporterCompanyVatNumber;

  const destinationCompanySiret =
    updatedDestinationCompanySiret !== undefined
      ? updatedDestinationCompanySiret
      : bsdasri.destinationCompanySiret;

  const ecoOrganismeSiret =
    updateEcoOrgansimeSiret !== undefined
      ? updateEcoOrgansimeSiret
      : bsdasri.ecoOrganismeSiret;

  return [
    emitterCompanySiret,
    transporterCompanySiret,
    transporterCompanyVatNumber,
    destinationCompanySiret,
    ecoOrganismeSiret
  ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to create a BSDASRI of the given payload
 */
function creators(input: BsdasriInput) {
  return [
    input.emitter?.company?.siret,
    input.transporter?.company?.siret,
    input.transporter?.company?.vatNumber,
    input.destination?.company?.siret,
    input.ecoOrganisme?.siret
  ].filter(Boolean);
}

export function checkCanRead(user: User, bsdasri: Bsdasri) {
  if (user.isAdmin && user.isActive) {
    return true;
  }
  const authorizedOrgIds = readers(bsdasri);
  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRead,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );
}

export async function checkCanCreate(user: User, bsdasriInput: BsdasriInput) {
  const authorizedOrgIds = creators(bsdasriInput);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas"
  );
}

export async function checkCanCreateSynthesis(
  user: User,
  bsdasriInput: BsdasriInput
) {
  const authorizedOrgIds = [
    bsdasriInput?.transporter?.company?.siret,
    bsdasriInput?.transporter?.company?.vatNumber
  ].filter(Boolean);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Seul le transporteur peut créer un BSDASRI de synthèse"
  );
}

export async function checkCanUpdate(
  user: User,
  bsdasri: Bsdasri,
  input?: BsdasriInput
) {
  const authorizedOrgIds = contributors(bsdasri);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparaît pas"
  );
  if (input) {
    const authorizedOrgIdsAfterUpdate = contributors(bsdasri, input);

    return checkUserPermissions(
      user,
      authorizedOrgIdsAfterUpdate,
      Permission.BsdCanUpdate,
      "Vous ne pouvez pas enlever votre établissement du bordereau"
    );
  }
  if (!!bsdasri.synthesizedInId)
    throw new ForbiddenError(
      "Ce bordereau est regroupé dans un bordereau de synthèse, il n'est pas modifiable, aucune signature ne peut y être apposée "
    );
  return true;
}

export async function checkCanDelete(user: User, bsdasri: Bsdasri) {
  const authorizedOrgIds =
    bsdasri.status === BsdasriStatus.INITIAL
      ? contributors(bsdasri)
      : bsdasri.status === BsdasriStatus.SIGNED_BY_PRODUCER
      ? [bsdasri.emitterCompanySiret]
      : [];

  const errorMsg =
    bsdasri.status === BsdasriStatus.INITIAL
      ? "Vous n'êtes pas autorisé à supprimer ce bordereau."
      : "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés";
  await checkUserPermissions(
    user,
    authorizedOrgIds.filter(Boolean),
    Permission.BsdCanDelete,
    errorMsg
  );

  // INITIAL dasris should not be synthesized or grouped, but let's keep a safeguard here
  if (!!bsdasri.synthesizedInId || !!bsdasri.groupedInId) {
    throw new ForbiddenError(
      "Ce bordereau est associé à un autre, il n'est pas supprimable"
    );
  }

  return true;
}

export async function checkCanDuplicate(user: User, bsdasri: Bsdasri) {
  const authorizedOrgIds = contributors(bsdasri);
  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas dupliquer un bordereau sur lequel votre entreprise n'apparait pas"
  );
}

export class InvalidPublicationAttempt extends UserInputError {
  constructor(reason?: string) {
    super(`Vous ne pouvez pas publier ce bordereau.${reason ?? ""}`);
  }
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

export function checkCanEditBsdasri(bsdasri: Bsdasri) {
  if (!!bsdasri.synthesizedInId)
    throw new ForbiddenError(
      "Ce bordereau est regroupé dans un bordereau de synthèse, il n'est pas modifiable, aucune signature ne peut y être apposée "
    );
  return true;
}

export async function checkCanRequestRevision(user: User, bsdasri: Bsdasri) {
  const authorizedOrgIds = [
    bsdasri.emitterCompanySiret,

    bsdasri.destinationCompanySiret,
    bsdasri.ecoOrganismeSiret
  ].filter(Boolean);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRevise,
    `Vous n'êtes pas autorisé à réviser ce bordereau`
  );
}
