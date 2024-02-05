import { Bsda, BsdaStatus, User } from "@prisma/client";
import { BsdaInput } from "../generated/graphql/types";
import { Permission, checkUserPermissions } from "../permissions";
import { getFirstTransporterSync, getPreviousBsdas } from "./database";
import { BsdaWithTransporters } from "./types";

/**
 * Retrieves organisations allowed to read a BSDA
 */
function readers(bsda: BsdaWithTransporters): string[] {
  return [
    bsda.emitterCompanySiret,
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
function contributors(bsda: BsdaWithTransporters, input?: BsdaInput): string[] {
  const updateEmitterCompanySiret = input?.emitter?.company?.siret;
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

  const transporter = getFirstTransporterSync(bsda);

  const emitterCompanySiret =
    updateEmitterCompanySiret !== undefined
      ? updateEmitterCompanySiret
      : bsda.emitterCompanySiret;

  const destinationCompanySiret =
    updateDestinationCompanySiret !== undefined
      ? updateDestinationCompanySiret
      : bsda.destinationCompanySiret;

  const transporterCompanySiret =
    updateTransporterCompanySiret !== undefined
      ? updateTransporterCompanySiret
      : transporter?.transporterCompanySiret;

  const transporterCompanyVatNumber =
    updateTransporterCompanyVatNumber !== undefined
      ? updateTransporterCompanyVatNumber
      : transporter?.transporterCompanyVatNumber;

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

  return [
    emitterCompanySiret,
    destinationCompanySiret,
    transporterCompanySiret,
    transporterCompanyVatNumber,
    workerCompanySiret,
    brokerCompanySiret,
    nextDestinationCompanySiret,
    ...intermediariesOrgIds
  ].filter(Boolean);
}

/**
 * Retrieves organisations allowed to create a BSDA of the given payload
 */
function creators(input: BsdaInput) {
  return [
    input.emitter?.company?.siret,
    input.transporter?.company?.siret,
    input.transporter?.company?.vatNumber,
    input.destination?.company?.siret,
    input.worker?.company?.siret,
    input.broker?.company?.siret,
    input.destination?.operation?.nextDestination?.company?.siret
  ].filter(Boolean);
}

export async function checkCanRead(user: User, bsda: BsdaWithTransporters) {
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
  const authorizedOrgIds = creators(bsdaInput);
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
  const authorizedOrgIds = contributors(bsda);

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );
  if (input) {
    const authorizedOrgIdsAfterUpdate = contributors(bsda, input);

    return checkUserPermissions(
      user,
      authorizedOrgIdsAfterUpdate,
      Permission.BsdCanUpdate,
      "Vous ne pouvez pas enlever votre établissement du bordereau"
    );
  }
  return true;
}

export async function checkCanDelete(user: User, bsda: BsdaWithTransporters) {
  const authorizedOrgIds =
    bsda.status === BsdaStatus.INITIAL
      ? contributors(bsda)
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
  const authorizedOrgIds = contributors(bsda);

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
