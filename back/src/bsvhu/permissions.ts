import { Bsvhu, BsvhuStatus, BsvhuTransporter, User } from "@prisma/client";
import type { BsvhuInput, BsvhuTransporterInput } from "@td/codegen-back";
import { Permission, checkUserPermissions } from "../permissions";
import { BsvhuWithTransporters } from "./types";
import { prisma } from "@td/prisma";
import { getFirstTransporterSync } from "./database";
import { flattenVhuTransporterInput } from "./converter";

/**
 * Retrieves organisations allowed to read a BSVHU
 */
function readers(bsvhu: Bsvhu): string[] {
  return bsvhu.isDraft
    ? [...bsvhu.canAccessDraftOrgIds]
    : [
        bsvhu.emitterCompanySiret,
        bsvhu.destinationCompanySiret,
        bsvhu.ecoOrganismeSiret,
        bsvhu.brokerCompanySiret,
        bsvhu.traderCompanySiret,
        ...bsvhu.intermediariesOrgIds,
        ...bsvhu.transportersOrgIds
      ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to update, delete or duplicate an existing BSVHU.
 * In case of update, this function can be called with an `updateInput`
 * parameter to pre-compute the form contributors after the update, hence verifying
 * a user is not removing his own company from the BSVHU
 */
async function contributors(
  bsvhu: BsvhuWithTransporters,
  input?: BsvhuInput
): Promise<string[]> {
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

  let transporters: Pick<
    BsvhuTransporter,
    "transporterCompanySiret" | "transporterCompanyVatNumber"
  >[] = bsvhu.transporters;

  const emitterCompanySiret =
    updateEmitterCompanySiret !== undefined
      ? updateEmitterCompanySiret
      : bsvhu.emitterCompanySiret;

  const destinationCompanySiret =
    updateDestinationCompanySiret !== undefined
      ? updateDestinationCompanySiret
      : bsvhu.destinationCompanySiret;

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

  if (input?.transporters) {
    // on prend en compte la nouvelle liste de tranporteurs fournit
    transporters = await prisma.bsvhuTransporter.findMany({
      where: { id: { in: input.transporters } }
    });
  } else if (input?.transporter) {
    const firstTransporter = getFirstTransporterSync(bsvhu);
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

  return [
    emitterCompanySiret,
    destinationCompanySiret,
    ecoOrganismeCompanySiret,
    brokerCompanySiret,
    traderCompanySiret,
    ...intermediariesOrgIds,
    ...transportersOrgIds
  ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to create a BSVHU of the given payload
 */
async function creators(input: BsvhuInput) {
  let transporters: Pick<
    BsvhuTransporter,
    "transporterCompanySiret" | "transporterCompanyVatNumber"
  >[] = [];

  if (input?.transporters) {
    // on prend en compte la nouvelle liste de tranporteurs fournit
    transporters = await prisma.bsvhuTransporter.findMany({
      where: { id: { in: input.transporters } }
    });
  } else if (input?.transporter) {
    transporters = [
      {
        transporterCompanySiret: input?.transporter?.company?.siret ?? null,
        transporterCompanyVatNumber:
          input?.transporter?.company?.vatNumber ?? null
      }
    ];
  }

  const transportersOrgIds = transporters
    .flatMap(t => [t.transporterCompanySiret, t.transporterCompanyVatNumber])
    .filter(Boolean);

  return [
    input.emitter?.company?.siret,
    input.ecoOrganisme?.siret,
    input.destination?.company?.siret,
    input.broker?.company?.siret,
    input.trader?.company?.siret,
    ...transportersOrgIds
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
  const authorizedOrgIds = await creators(bsvhuInput);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Votre établissement doit être visé sur le bordereau"
  );
}

export async function checkCanUpdate(
  user: User,
  bsvhu: BsvhuWithTransporters,
  input?: BsvhuInput
) {
  const authorizedOrgIds = await contributors(bsvhu);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Votre établissement doit être visé sur le bordereau"
  );
  if (input) {
    const authorizedOrgIdsAfterUpdate = await contributors(bsvhu, input);

    return checkUserPermissions(
      user,
      authorizedOrgIdsAfterUpdate,
      Permission.BsdCanUpdate,
      "Vous ne pouvez pas enlever votre établissement du bordereau"
    );
  }
  return true;
}

export async function checkCanUpdateBsvhuTransporter(
  user: User,
  bsvhu: BsvhuWithTransporters,
  transporterId: string,
  input: BsvhuTransporterInput
) {
  const authorizedOrgIds = await contributors(bsvhu);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Vous n'êtes pas autorisé à modifier ce transporteur BSVHU"
  );

  if (input) {
    const futureTransporters = bsvhu.transporters.map(transporter => {
      if (transporter.id === transporterId) {
        return {
          ...transporter,
          ...flattenVhuTransporterInput(input)
        };
      }
      return transporter;
    });

    const futureContributors = await contributors({
      ...bsvhu,
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

export async function checkCanDelete(user: User, bsvhu: BsvhuWithTransporters) {
  const authorizedOrgIds =
    bsvhu.status === BsvhuStatus.INITIAL
      ? await contributors(bsvhu)
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

export async function checkCanDuplicate(
  user: User,
  bsvhu: BsvhuWithTransporters
) {
  const authorizedOrgIds = await contributors(bsvhu);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas dupliquer un bordereau sur lequel votre entreprise n'apparait pas"
  );
}
