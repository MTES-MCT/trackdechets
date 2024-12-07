import { Bsvhu, BsvhuStatus, User } from "@prisma/client";
import { BsvhuInput } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../permissions";

/**
 * Retrieves organisations allowed to read a BSVHU
 */
function readers(bsvhu: Bsvhu): string[] {
  return bsvhu.isDraft
    ? [...bsvhu.canAccessDraftOrgIds]
    : [
        bsvhu.emitterCompanySiret,
        bsvhu.destinationCompanySiret,
        bsvhu.transporterCompanySiret,
        bsvhu.transporterCompanyVatNumber,
        bsvhu.ecoOrganismeSiret,
        bsvhu.brokerCompanySiret,
        bsvhu.traderCompanySiret,
        ...bsvhu.intermediariesOrgIds
      ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to update, delete or duplicate an existing BSVHU.
 * In case of update, this function can be called with an `updateInput`
 * parameter to pre-compute the form contributors after the update, hence verifying
 * a user is not removing his own company from the BSVHU
 */
function contributors(bsvhu: Bsvhu, input?: BsvhuInput): string[] {
  if (bsvhu.isDraft) {
    return [...bsvhu.canAccessDraftOrgIds];
  }
  const updateEmitterCompanySiret = input?.emitter?.company?.siret;
  const updateDestinationCompanySiret = input?.destination?.company?.siret;
  const updateTransporterCompanySiret = input?.transporter?.company?.siret;
  const updateTransporterCompanyVatNumber =
    input?.transporter?.company?.vatNumber;
  const updateEcoOrganismeCompanySiret = input?.ecoOrganisme?.siret;
  const updateBrokerCompanySiret = input?.broker?.company?.siret;
  const updateTraderCompanySiret = input?.trader?.company?.siret;

  const updateIntermediaries = (input?.intermediaries ?? []).flatMap(i => [
    i.siret,
    i.vatNumber
  ]);

  const emitterCompanySiret =
    updateEmitterCompanySiret !== undefined
      ? updateEmitterCompanySiret
      : bsvhu.emitterCompanySiret;

  const destinationCompanySiret =
    updateDestinationCompanySiret !== undefined
      ? updateDestinationCompanySiret
      : bsvhu.destinationCompanySiret;

  const transporterCompanySiret =
    updateTransporterCompanySiret !== undefined
      ? updateTransporterCompanySiret
      : bsvhu.transporterCompanySiret;

  const transporterCompanyVatNumber =
    updateTransporterCompanyVatNumber !== undefined
      ? updateTransporterCompanyVatNumber
      : bsvhu.transporterCompanyVatNumber;

  const ecoOrganismeCompanySiret =
    updateEcoOrganismeCompanySiret !== undefined
      ? updateEcoOrganismeCompanySiret
      : bsvhu.ecoOrganismeSiret;

  const brokerCompanySiret =
    updateBrokerCompanySiret !== undefined
      ? updateBrokerCompanySiret
      : bsvhu.brokerCompanySiret;

  const traderCompanySiret =
    updateTraderCompanySiret !== undefined
      ? updateTraderCompanySiret
      : bsvhu.traderCompanySiret;

  const intermediariesOrgIds =
    input?.intermediaries !== undefined
      ? updateIntermediaries
      : bsvhu.intermediariesOrgIds;

  return [
    emitterCompanySiret,
    destinationCompanySiret,
    transporterCompanySiret,
    transporterCompanyVatNumber,
    ecoOrganismeCompanySiret,
    brokerCompanySiret,
    traderCompanySiret,
    ...intermediariesOrgIds
  ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to create a BSVHU of the given payload
 */
function creators(input: BsvhuInput) {
  return [
    input.emitter?.company?.siret,
    input.ecoOrganisme?.siret,
    input.transporter?.company?.siret,
    input.transporter?.company?.vatNumber,
    input.destination?.company?.siret,
    input.broker?.company?.siret,
    input.trader?.company?.siret
  ].filter(Boolean);
}

export async function checkCanRead(user: User, bsvhu: Bsvhu) {
  if (user.isAdmin && user.isActive) {
    return true;
  }
  const authorizedOrgIds = readers(bsvhu);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRead,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );
}

export async function checkCanCreate(user: User, bsvhuInput: BsvhuInput) {
  const authorizedOrgIds = creators(bsvhuInput);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Votre établissement doit être visé sur le bordereau"
  );
}

export async function checkCanUpdate(
  user: User,
  bsvhu: Bsvhu,
  input?: BsvhuInput
) {
  const authorizedOrgIds = contributors(bsvhu);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Votre établissement doit être visé sur le bordereau"
  );
  if (input) {
    const authorizedOrgIdsAfterUpdate = contributors(bsvhu, input);

    return checkUserPermissions(
      user,
      authorizedOrgIdsAfterUpdate,
      Permission.BsdCanUpdate,
      "Vous ne pouvez pas enlever votre établissement du bordereau"
    );
  }
  return true;
}

export async function checkCanDelete(user: User, bsvhu: Bsvhu) {
  const authorizedOrgIds =
    bsvhu.status === BsvhuStatus.INITIAL
      ? contributors(bsvhu)
      : bsvhu.status === BsvhuStatus.SIGNED_BY_PRODUCER &&
        bsvhu.emitterCompanySiret
      ? [bsvhu.emitterCompanySiret]
      : [];

  const errorMsg =
    bsvhu.status === BsvhuStatus.INITIAL
      ? "Vous n'êtes pas autorisé à supprimer ce bordereau."
      : "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés";
  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanDelete,
    errorMsg
  );
}

export async function checkCanDuplicate(user: User, bsvhu: Bsvhu) {
  const authorizedOrgIds = contributors(bsvhu);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas dupliquer un bordereau sur lequel votre entreprise n'apparait pas"
  );
}
