import { Bsda, BsdaStatus, BsdaTransporter, User } from "@prisma/client";
import { BsdaInput, BsdaTransporterInput } from "../generated/graphql/types";
import { Permission, checkUserPermissions } from "../permissions";
import { getFirstTransporterSync, getPreviousBsdas } from "./database";
import { BsdaWithTransporters } from "./types";
import { flattenBsdaTransporterInput } from "./converter";
import { prisma } from "@td/prisma";

/**
 * Retrieves organisations allowed to read a BSDA
 */
function readers(bsda: BsdaWithTransporters): string[] {
  return bsda.isDraft
    ? [...bsda.canAccessDraftOrgIds]
    : [
        bsda.emitterCompanySiret,
        bsda.ecoOrganismeSiret,
        bsda.destinationCompanySiret,
        ...bsda.transporters.flatMap(t => [
          t.transporterCompanySiret,
          t.transporterCompanyVatNumber
        ]),
        bsda.workerCompanySiret,
        bsda.brokerCompanySiret,
        bsda.destinationOperationNextDestinationCompanySiret,
        ...bsda.intermediariesOrgIds
      ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to update, delete or duplicate an existing BSDA.
 * In case of update, this function can be called with an `updateInput`
 * parameter to pre-compute the form contributors after the update, hence verifying
 * a user is not removing his own company from the BSDA
 */
async function contributors(
  bsda: BsdaWithTransporters,
  input?: BsdaInput
): Promise<string[]> {
  if (bsda.isDraft) {
    return [...bsda.canAccessDraftOrgIds];
  }
  const updateEmitterCompanySiret = input?.emitter?.company?.siret;
  const updateEcoOrganismeCompanySiret = input?.ecoOrganisme?.siret;
  const updateDestinationCompanySiret = input?.destination?.company?.siret;
  const updateTransporterCompanySiret = input?.transporter?.company?.siret;
  const updateTransporterCompanyVatNumber =
    input?.transporter?.company?.vatNumber;
  const updateWorkerCompanySiret = input?.worker?.company?.siret;
  const updateBrokerCompanySiret = input?.broker?.company?.siret;
  const updateNextDestinationCompanySiret =
    input?.destination?.operation?.nextDestination?.company?.siret;
  const updateIntermediaries = (input?.intermediaries ?? []).flatMap(i => [
    i.siret,
    i.vatNumber
  ]);

  let transporters: Pick<
    BsdaTransporter,
    "transporterCompanySiret" | "transporterCompanyVatNumber"
  >[] = bsda.transporters;

  const emitterCompanySiret =
    updateEmitterCompanySiret !== undefined
      ? updateEmitterCompanySiret
      : bsda.emitterCompanySiret;

  const ecoOrganismeCompanySiret =
    updateEcoOrganismeCompanySiret !== undefined
      ? updateEcoOrganismeCompanySiret
      : bsda.ecoOrganismeSiret;

  const destinationCompanySiret =
    updateDestinationCompanySiret !== undefined
      ? updateDestinationCompanySiret
      : bsda.destinationCompanySiret;

  const workerCompanySiret =
    updateWorkerCompanySiret !== undefined
      ? updateWorkerCompanySiret
      : bsda.workerCompanySiret;

  const brokerCompanySiret =
    updateBrokerCompanySiret !== undefined
      ? updateBrokerCompanySiret
      : bsda.brokerCompanySiret;

  const nextDestinationCompanySiret =
    updateNextDestinationCompanySiret !== undefined
      ? updateNextDestinationCompanySiret
      : bsda.destinationOperationNextDestinationCompanySiret;

  const intermediariesOrgIds =
    input?.intermediaries !== undefined
      ? updateIntermediaries
      : bsda.intermediariesOrgIds;

  if (input?.transporters) {
    // on prend en compte la nouvelle liste de tranporteurs fournit
    transporters = await prisma.bsdaTransporter.findMany({
      where: { id: { in: input.transporters } }
    });
  } else if (input?.transporter) {
    const firstTransporter = getFirstTransporterSync(bsda);
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
    ecoOrganismeCompanySiret,
    destinationCompanySiret,
    workerCompanySiret,
    brokerCompanySiret,
    nextDestinationCompanySiret,
    ...transportersOrgIds,
    ...intermediariesOrgIds
  ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to create a BSDA of the given payload
 */
async function creators(input: BsdaInput) {
  let transporters: Pick<
    BsdaTransporter,
    "transporterCompanySiret" | "transporterCompanyVatNumber"
  >[] = [];

  if (input?.transporters) {
    // on prend en compte la nouvelle liste de tranporteurs fournit
    transporters = await prisma.bsdaTransporter.findMany({
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

  const intermediariesOrgIds =
    input.intermediaries?.map(i => i.siret).filter(Boolean) ?? [];

  return [
    input.emitter?.company?.siret,
    input.ecoOrganisme?.siret,
    ...transporters.flatMap(t => [
      t.transporterCompanySiret,
      t.transporterCompanyVatNumber
    ]),
    ...intermediariesOrgIds,
    input.destination?.company?.siret,
    input.worker?.company?.siret,
    input.broker?.company?.siret,
    input.destination?.operation?.nextDestination?.company?.siret
  ].filter(Boolean);
}

export async function checkCanRead(user: User, bsda: BsdaWithTransporters) {
  if (user.isAdmin && user.isActive) {
    return true;
  }
  const authorizedOrgIds = readers(bsda);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRead,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );
}

export async function checkCanReadPdf(user: User, bsda: BsdaWithTransporters) {
  const previousBsdas = await getPreviousBsdas(bsda, {
    include: { intermediaries: true, transporters: true }
  });

  const authorizedOrgIds: string[] = [
    ...readers(bsda),
    ...previousBsdas.flatMap(readers)
  ];

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRead,
    "Vous n'êtes pas autorisé à accéder au récépissé PDF de ce BSDA."
  );
}

export async function checkCanCreate(user: User, bsdaInput: BsdaInput) {
  const authorizedOrgIds = await creators(bsdaInput);
  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );
}

export async function checkCanUpdate(
  user: User,
  bsda: BsdaWithTransporters,
  input?: BsdaInput
) {
  const authorizedOrgIds = await contributors(bsda);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );
  if (input) {
    const authorizedOrgIdsAfterUpdate = await contributors(bsda, input);

    return checkUserPermissions(
      user,
      authorizedOrgIdsAfterUpdate,
      Permission.BsdCanUpdate,
      "Vous ne pouvez pas enlever votre établissement du bordereau"
    );
  }
  return true;
}

export async function checkCanUpdateBsdaTransporter(
  user: User,
  bsda: BsdaWithTransporters,
  transporterId: string,
  input: BsdaTransporterInput
) {
  const authorizedOrgIds = await contributors(bsda);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Vous n'êtes pas autorisé à modifier ce transporteur BSDA"
  );

  if (input) {
    const futureTransporters = bsda.transporters.map(transporter => {
      if (transporter.id === transporterId) {
        return {
          ...transporter,
          ...flattenBsdaTransporterInput(input)
        };
      }
      return transporter;
    });

    const futureContributors = await contributors({
      ...bsda,
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

export async function checkCanDelete(user: User, bsda: BsdaWithTransporters) {
  const authorizedOrgIds =
    bsda.status === BsdaStatus.INITIAL
      ? await contributors(bsda)
      : bsda.status === BsdaStatus.SIGNED_BY_PRODUCER &&
        bsda.emitterCompanySiret
      ? [bsda.emitterCompanySiret]
      : [];

  const errorMsg =
    bsda.status === BsdaStatus.INITIAL
      ? "Vous n'êtes pas autorisé à supprimer ce bordereau."
      : "Seuls les bordereaux en brouillon ou n'ayant pas encore été signés peuvent être supprimés";
  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanDelete,
    errorMsg
  );
}

export async function checkCanDuplicate(
  user: User,
  bsda: BsdaWithTransporters
) {
  const authorizedOrgIds = await contributors(bsda);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas dupliquer un bordereau sur lequel votre entreprise n'apparait pas"
  );
}

export async function checkCanRequestRevision(user: User, bsda: Bsda) {
  const authorizedOrgIds = [
    bsda.emitterCompanySiret,
    bsda.workerCompanySiret,
    bsda.destinationCompanySiret
  ].filter(Boolean);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRevise,
    `Vous n'êtes pas autorisé à réviser ce bordereau`
  );
}
