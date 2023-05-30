import { User, Bsff, BsffFicheIntervention, BsffStatus } from "@prisma/client";
import {
  BsffFicheInterventionInput,
  BsffInput
} from "../generated/graphql/types";
import { Permission, checkUserPermissions } from "../permissions";

/**
 * Retrieves organisations allowed to read a BSFF
 */
export function readers(bsff: Bsff) {
  return [
    bsff.emitterCompanySiret,
    bsff.transporterCompanySiret,
    bsff.transporterCompanyVatNumber,
    bsff.destinationCompanySiret,
    ...bsff.detenteurCompanySirets
  ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to update, delete or duplicate an existing BSFF.
 * In case of update, this function can be called with an `updateInput`
 * parameter to pre-compute the form contributors after the update, hence verifying
 * a user is not removing his own company from the BSFF
 */
function contributors(bsff: Bsff, input?: BsffInput) {
  const updateEmitterCompanySiret = input?.emitter?.company?.siret;
  const updateTransporterCompanySiret = input?.transporter?.company?.siret;
  const updateTransporterCompanyVatNumber =
    input?.transporter?.company?.vatNumber;
  const updateDestinationCompanySiret = input?.destination?.company?.siret;

  const emitterCompanySiret =
    updateEmitterCompanySiret !== undefined
      ? updateEmitterCompanySiret
      : bsff.emitterCompanySiret;

  const transporterCompanySiret =
    updateTransporterCompanySiret !== undefined
      ? updateTransporterCompanySiret
      : bsff.transporterCompanySiret;

  const transporterCompanyVatNumber =
    updateTransporterCompanyVatNumber !== undefined
      ? updateTransporterCompanyVatNumber
      : bsff.transporterCompanyVatNumber;

  const destinationCompanySiret =
    updateDestinationCompanySiret !== undefined
      ? updateDestinationCompanySiret
      : bsff.destinationCompanySiret;

  return [
    emitterCompanySiret,
    transporterCompanySiret,
    transporterCompanyVatNumber,
    destinationCompanySiret
  ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to create a BSFF of the given payload
 */
function creators(input: BsffInput) {
  return [
    input?.emitter?.company?.siret,
    input?.transporter?.company?.siret,
    input?.transporter?.company?.vatNumber,
    input?.destination?.company?.siret
  ].filter(Boolean);
}

export async function checkCanRead(user: User, bsff: Bsff) {
  const authorizedOrgIds = readers(bsff);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRead,
    "Vous ne pouvez pas accéder à ce BSFF"
  );
}

export async function checkCanCreate(user: User, bsffInput: BsffInput) {
  const authorizedOrgIds = creators(bsffInput);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
  );
}

export async function checkCanDuplicate(user: User, bsff: Bsff) {
  const authorizedOrgIds = contributors(bsff);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas dupliquer un bordereau sur lequel votre entreprise n'apparait pas"
  );
}

export async function checkCanCreateFicheIntervention(
  user: User,
  ficheInterventionInput: BsffFicheInterventionInput
) {
  const authorizedOrgIds = [
    ficheInterventionInput.operateur?.company?.siret
  ].filter(Boolean);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Seul l'opérateur peut créer une fiche d'intervention."
  );
}

export async function checkCanUpdate(
  user: User,
  bsff: Bsff,
  input?: BsffInput
) {
  const authorizedOrgIds = contributors(bsff);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
  );
  if (input) {
    const authorizedOrgIdsAfterUpdate = contributors(bsff, input);

    return checkUserPermissions(
      user,
      authorizedOrgIdsAfterUpdate,
      Permission.BsdCanUpdate,
      "Vous ne pouvez pas enlever votre propre établissement de ce BSFF"
    );
  }
  return true;
}

export async function checkCanUpdateBsffPackaging(user: User, bsff: Bsff) {
  const authorizedOrgIds = [bsff.destinationCompanySiret].filter(Boolean);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Seul le destinataire du BSFF peut modifier les informations d'acceptation et d'opération sur un contenant"
  );
}

export async function checkCanUpdateFicheIntervention(
  user: User,
  ficheIntervention: BsffFicheIntervention,
  input?: BsffFicheInterventionInput
) {
  const authorizedOrgIds = [ficheIntervention.operateurCompanySiret].filter(
    Boolean
  );

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Seul l'opérateur peut modifier une fiche d'intervention."
  );
  if (input && input.operateur?.company?.siret) {
    await checkUserPermissions(
      user,
      [input.operateur?.company?.siret].filter(Boolean),
      Permission.BsdCanUpdate,
      "Vous ne pouvez pas enlever votre établissement de cette fiche d'intervention."
    );
  }
  return true;
}

export async function checkCanDelete(user: User, bsff: Bsff) {
  const authorizedOrgIds =
    bsff.status === BsffStatus.INITIAL
      ? contributors(bsff)
      : bsff.status === BsffStatus.SIGNED_BY_EMITTER
      ? [bsff.emitterCompanySiret]
      : [];

  const errorMsg =
    bsff.status === BsffStatus.INITIAL
      ? "Vous ne pouvez pas supprimer ce BSFF"
      : `Il n'est pas possible de supprimer un bordereau qui a été signé par un des acteurs`;
  return checkUserPermissions(
    user,
    authorizedOrgIds.filter(Boolean),
    Permission.BsdCanDelete,
    errorMsg
  );
}
