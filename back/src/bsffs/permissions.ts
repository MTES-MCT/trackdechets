import {
  User,
  Bsff,
  BsffFicheIntervention,
  BsffStatus,
  BsffTransporter
} from "@prisma/client";
import type {
  BsffFicheInterventionInput,
  BsffInput,
  BsffTransporterInput
} from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../permissions";
import { BsffWithTransporters } from "./types";
import { getFirstTransporterSync } from "./database";
import { flattenBsffTransporterInput } from "./converter";
import { prisma } from "@td/prisma";

/**
 * Retrieves organisations allowed to read a BSFF
 */
export function readers(bsff: BsffWithTransporters) {
  return bsff.isDraft
    ? [...bsff.canAccessDraftOrgIds]
    : [
        bsff.emitterCompanySiret,
        ...bsff.transporters.flatMap(t => [
          t.transporterCompanySiret,
          t.transporterCompanyVatNumber
        ]),
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
async function contributors(bsff: BsffWithTransporters, input?: BsffInput) {
  const updateEmitterCompanySiret = input?.emitter?.company?.siret;
  const updateTransporterCompanySiret = input?.transporter?.company?.siret;
  const updateTransporterCompanyVatNumber =
    input?.transporter?.company?.vatNumber;
  const updateDestinationCompanySiret = input?.destination?.company?.siret;

  let transporters: Pick<
    BsffTransporter,
    "transporterCompanySiret" | "transporterCompanyVatNumber"
  >[] = bsff.transporters;

  const emitterCompanySiret =
    updateEmitterCompanySiret !== undefined
      ? updateEmitterCompanySiret
      : bsff.emitterCompanySiret;

  const destinationCompanySiret =
    updateDestinationCompanySiret !== undefined
      ? updateDestinationCompanySiret
      : bsff.destinationCompanySiret;

  if (input?.transporters) {
    // on prend en compte la nouvelle liste de tranporteurs fournis
    transporters = await prisma.bsffTransporter.findMany({
      where: { id: { in: input.transporters } }
    });
  } else if (input?.transporter) {
    const firstTransporter = getFirstTransporterSync(bsff);
    if (!firstTransporter) {
      transporters = [
        {
          transporterCompanySiret: input?.transporter?.company?.siret ?? null,
          transporterCompanyVatNumber:
            input?.transporter?.company?.vatNumber ?? null
        }
      ];
    } else {
      // on met à jour le transporteur 1 s'il existe ou on l'ajoute à la liste s'il n'existe pas
      const transporterCompanySiret =
        updateTransporterCompanySiret !== undefined
          ? updateTransporterCompanySiret
          : firstTransporter.transporterCompanySiret;
      const transporterCompanyVatNumber =
        updateTransporterCompanyVatNumber !== undefined
          ? updateTransporterCompanyVatNumber
          : firstTransporter.transporterCompanyVatNumber;

      const updatedFirstTransporter = {
        ...firstTransporter,
        transporterCompanySiret,
        transporterCompanyVatNumber
      };

      transporters = [updatedFirstTransporter, ...transporters.slice(1)];
    }
  }

  const transportersOrgIds = transporters
    .flatMap(t => [t.transporterCompanySiret, t.transporterCompanyVatNumber])
    .filter(Boolean);

  const bsffContributors = [
    emitterCompanySiret,
    destinationCompanySiret,
    ...transportersOrgIds
  ].filter(Boolean);

  if (bsff.isDraft) {
    return bsffContributors.filter(cb =>
      bsff.canAccessDraftOrgIds.includes(cb)
    );
  }

  return bsffContributors;
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

export async function checkCanRead(user: User, bsff: BsffWithTransporters) {
  if (user.isAdmin && user.isActive) {
    return true;
  }
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

export async function checkCanDuplicate(
  user: User,
  bsff: BsffWithTransporters
) {
  const authorizedOrgIds = await contributors(bsff);

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
  bsff: BsffWithTransporters,
  input?: BsffInput
) {
  const authorizedOrgIds = await contributors(bsff);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
  );
  if (input) {
    const authorizedOrgIdsAfterUpdate = await contributors(bsff, input);

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

export async function checkCanDelete(user: User, bsff: BsffWithTransporters) {
  const authorizedOrgIds =
    bsff.status === BsffStatus.INITIAL
      ? await contributors(bsff)
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

export async function checkCanUpdateBsffTransporter(
  user: User,
  bsff: BsffWithTransporters,
  transporterId: string,
  input: BsffTransporterInput
) {
  const authorizedOrgIds = await contributors(bsff);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Vous n'êtes pas autorisé à modifier ce transporteur BSFF"
  );

  if (input) {
    const futureTransporters = bsff.transporters.map(transporter => {
      if (transporter.id === transporterId) {
        return {
          ...transporter,
          ...flattenBsffTransporterInput(input)
        };
      }
      return transporter;
    });

    const futureContributors = await contributors({
      ...bsff,
      transporters: futureTransporters
    });

    return checkUserPermissions(
      user,
      futureContributors,
      Permission.BsdCanUpdate,
      "Vous ne pouvez pas enlever votre établissement du bordereau"
    );
  }
}
