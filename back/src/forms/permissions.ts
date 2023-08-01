import {
  BsddTransporter,
  EmitterType,
  Form,
  Status,
  User
} from "@prisma/client";
import {
  CreateFormInput,
  ImportPaperFormInput,
  UpdateFormInput
} from "../generated/graphql/types";
import {
  Permission,
  checkUserPermissions,
  getUserRoles,
  can
} from "../permissions";
import prisma from "../prisma";
import {
  getFirstTransporter,
  getFirstTransporterSync,
  getFullForm
} from "./database";
import { getReadOnlyFormRepository } from "./repository";
import { checkSecurityCode } from "../common/permissions";
import { FullForm } from "./types";
import { editionRules, getUpdatedFields } from "./edition";
import { ForbiddenError } from "../common/errors";

/**
 * Retrieves companies allowed to update, delete or duplicate an existing BSDD.
 * In case of update, this function can be called with an `updateInput`
 * parameter to pre-compute the form contributors after the update, hence verifying
 * a user is not removing his own company from the BSDD
 */
function formContributors(form: FullForm, input?: UpdateFormInput): string[] {
  const updateEmitterCompanySiret = input?.emitter?.company?.siret;
  const updateRecipientCompanySiret = input?.recipient?.company?.siret;
  const updateTransporterCompanySiret = input?.transporter?.company?.siret;
  const updateTransporterCompanyVatNumber =
    input?.transporter?.company?.vatNumber;
  const updateTraderCompanySiret = input?.trader?.company?.siret;
  const updateBrokerCompanySiret = input?.broker?.company?.siret;
  const updateEcoOrganismeSiret = input?.ecoOrganisme?.siret;
  const updateFinalDestinationCompanySiret =
    input?.temporaryStorageDetail?.destination?.company?.siret;

  const transporter = getFirstTransporterSync(form);
  let forwardedInTransporter: BsddTransporter | null = null;
  if (form.forwardedIn) {
    forwardedInTransporter = getFirstTransporterSync(form.forwardedIn);
  }

  const emitterCompanySiret =
    updateEmitterCompanySiret !== undefined
      ? updateEmitterCompanySiret
      : form.emitterCompanySiret;

  const recipientCompanySiret =
    updateRecipientCompanySiret !== undefined
      ? updateRecipientCompanySiret
      : form.recipientCompanySiret;

  const transporterCompanySiret =
    updateTransporterCompanySiret !== undefined
      ? updateTransporterCompanySiret
      : transporter?.transporterCompanySiret;

  const transporterCompanyVatNumber =
    updateTransporterCompanyVatNumber !== undefined
      ? updateTransporterCompanyVatNumber
      : transporter?.transporterCompanyVatNumber;

  const traderCompanySiret =
    updateTraderCompanySiret !== undefined
      ? updateTraderCompanySiret
      : form.traderCompanySiret;

  const brokerCompanySiret =
    updateBrokerCompanySiret !== undefined
      ? updateBrokerCompanySiret
      : form.brokerCompanySiret;

  const ecoOrganismeSiret =
    updateEcoOrganismeSiret !== undefined
      ? updateEcoOrganismeSiret
      : form.ecoOrganismeSiret;

  const bsdSuiteOrgIds = form.forwardedIn
    ? [
        forwardedInTransporter?.transporterCompanySiret,
        forwardedInTransporter?.transporterCompanyVatNumber,
        updateFinalDestinationCompanySiret !== undefined
          ? updateFinalDestinationCompanySiret
          : form.forwardedIn.recipientCompanySiret
      ]
    : [];

  const intermediariesOrgIds =
    input?.intermediaries !== undefined
      ? (input.intermediaries ?? []).flatMap(i => [i.siret, i.vatNumber])
      : form.intermediaries
      ? form.intermediaries.flatMap(i => [i.siret, i.vatNumber])
      : [];

  const multiModalTransporters = (form.transporters ?? []).map(
    s => s.transporterCompanySiret
  );

  const contributors = [
    emitterCompanySiret,
    recipientCompanySiret,
    transporterCompanySiret,
    transporterCompanyVatNumber,
    traderCompanySiret,
    brokerCompanySiret,
    ecoOrganismeSiret,
    ...bsdSuiteOrgIds,
    ...intermediariesOrgIds,
    ...multiModalTransporters
  ].filter(Boolean);

  // For enhanced safety, we intersect canAccessDraftSirets & contributors
  // as canAccessDraftSirets is calculated on create and the contributors might change
  if (form.status === Status.DRAFT) {
    return form.canAccessDraftSirets.filter(siret =>
      contributors.includes(siret)
    );
  }

  return contributors;
}

/**
 * Retrieves companies allowed to create a form of the given payload
 */
function formCreators(input: CreateFormInput): string[] {
  return [
    input.emitter?.company?.siret,
    input.recipient?.company?.siret,
    input.transporter?.company?.siret,
    input.transporter?.company?.vatNumber,
    input.trader?.company?.siret,
    input.broker?.company?.siret,
    input.ecoOrganisme?.siret,
    input.temporaryStorageDetail?.destination?.company?.siret,
    ...(input.intermediaries
      ? input.intermediaries.flatMap(i => [i.siret, i.vatNumber])
      : [])
  ].filter(Boolean);
}

/**
 * Retrieves organisation allowed to read a BSDD
 */
function formReaders(form: FullForm & { grouping: Form[] }): string[] {
  if (form.status === Status.DRAFT) {
    return formContributors(form);
  }

  return [
    ...formContributors(form),
    ...(form.transporters
      ? form.transporters.map(s => s.transporterCompanySiret)
      : []),
    ...(form.grouping ? form.grouping.map(f => f.emitterCompanySiret) : [])
  ].filter(Boolean);
}

export function isFormReader(user: User, form: Form) {
  return checkCanRead(user, form).catch(_ => false);
}

export async function checkCanRead(user: User, form: Form) {
  const fullForm = await getFullForm(form);
  const { findGroupedFormsById } = getReadOnlyFormRepository();
  const grouping = await findGroupedFormsById(form.id);
  const authorizedOrgIds = formReaders({ ...fullForm, grouping });

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRead,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );
}

export async function checkCanList(user: User, orgId: string) {
  return checkUserPermissions(
    user,
    [orgId].filter(Boolean),
    Permission.BsdCanList,
    `Vous n'avez pas la permission de lister les bordereaux de l'établissement ${orgId}`
  );
}

export async function checkCanCreate(user: User, input: CreateFormInput) {
  const authorizedOrgIds = formCreators(input);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );
}

export async function checkCanUpdate(
  user: User,
  form: Form,
  input: UpdateFormInput
) {
  if (form.emitterType === EmitterType.APPENDIX1 && form.status === "SENT") {
    return true;
  }

  const fullForm = await getFullForm(form);

  const transporter = getFirstTransporterSync(fullForm);

  let authorizedOrgIds: string[] = [];
  let errorMsg = "Vous n'êtes pas autorisé à modifier ce bordereau";

  if (
    ["DRAFT", "SEALED"].includes(form.status) ||
    (form.emitterType === EmitterType.APPENDIX1 && form.status === "SENT")
  ) {
    authorizedOrgIds = formContributors(fullForm);
  } else if (form.status === "SIGNED_BY_PRODUCER") {
    const updatedFields = await getUpdatedFields(form, input);
    if (form.emitterType === EmitterType.APPENDIX1_PRODUCER) {
      // Le transporteur peut modifier les données de l'annexe 1 jusqu'à sa signature
      authorizedOrgIds = [transporter?.transporterCompanySiret].filter(Boolean);
    } else if (updatedFields.every(f => editionRules[f] === "TRANSPORT")) {
      // Les infos de transport peuvent être modifiées par tous les acteurs
      // du BSDD tant que le déchet n'a pas été enlevé
      authorizedOrgIds = formContributors(fullForm);
    } else {
      if (form.emittedByEcoOrganisme) {
        authorizedOrgIds = [form.ecoOrganismeSiret].filter(Boolean);
        errorMsg =
          "L'éco-organisme a signé ce bordereau, seules les informations de transport peuvent être mises à jour.";
      } else {
        authorizedOrgIds = [form.emitterCompanySiret].filter(Boolean);
        errorMsg =
          "Le producteur a signé ce bordereau, seules les informations de transport peuvent être mises à jour.";
      }
    }
  } else {
    errorMsg =
      "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être modifiés";
  }

  await checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    errorMsg
  );

  const futureContributors = formContributors(fullForm, input);

  return checkUserPermissions(
    user,
    futureContributors,
    Permission.BsdCanUpdate,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );
}

export async function checkCanDuplicate(user: User, form: Form) {
  const fullForm = await getFullForm(form);
  const authorizedOrgIds = formContributors(fullForm);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanCreate,
    "Vous n'êtes pas autorisé à dupliquer ce bordereau"
  );
}

export async function checkCanDelete(user: User, form: Form) {
  const fullForm = await getFullForm(form);

  let authorizedOrgIds: string[] = [];
  let errorMsg = "Vous n'êtes pas autorisé à supprimer ce bordereau";

  if (["DRAFT", "SEALED"].includes(form.status)) {
    authorizedOrgIds = formContributors(fullForm);
  } else if (
    form.status === "SIGNED_BY_PRODUCER" &&
    form.emittedByEcoOrganisme
  ) {
    authorizedOrgIds = [form.ecoOrganismeSiret].filter(Boolean);
    errorMsg =
      "L'éco-organisme a signé ce bordereau, il est le seul à pouvoir le supprimer.";
  } else if (
    form.status === "SIGNED_BY_PRODUCER" &&
    !form.emittedByEcoOrganisme
  ) {
    authorizedOrgIds = [form.emitterCompanySiret].filter(Boolean);
    errorMsg =
      "Le producteur a signé ce bordereau, il est le seul à pouvoir le supprimer.";
  } else {
    errorMsg =
      "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés";
  }

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanDelete,
    errorMsg
  );
}

export async function checkCanMarkAsSealed(user: User, form: Form) {
  const fullForm = await getFullForm(form);
  const authorizedOrgIds = formContributors(fullForm);
  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanDelete,
    "Vous n'êtes pas autorisé à sceller ce bordereau"
  );
}

export async function checkCanSignedByTransporter(user: User, form: Form) {
  if (EmitterType.APPENDIX1 === form.emitterType) {
    throw new ForbiddenError(
      "Un bordereau de tournée ne peut pas être marqué comme signé par le transporteur. Son statut sera mis à jour à la signature des annexes 1 qu'il contient."
    );
  }

  const { forwardedIn, ...fullForm } = await getFullForm(form);
  const transporter = getFirstTransporterSync(fullForm);
  const forwardedInTransporter = forwardedIn
    ? getFirstTransporterSync(forwardedIn)
    : null;

  const authorizedOrgIds = [
    transporter?.transporterCompanySiret,
    transporter?.transporterCompanyVatNumber,
    forwardedInTransporter?.transporterCompanySiret,
    forwardedInTransporter?.transporterCompanyVatNumber
  ].filter(Boolean);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanSignTransport,
    "Vous n'êtes pas autorisé à signer ce bordereau pour le transport"
  );
}

export async function checkCanSignFor(
  siret: string,
  user: User,
  permission: Permission,
  securityCode?: number | null
) {
  const userRoles = await getUserRoles(user.id);
  if (userRoles[siret] && can(userRoles[siret], permission)) {
    return true;
  }
  if (securityCode) {
    return checkSecurityCode(siret, securityCode);
  }

  throw new ForbiddenError(
    "Vous n'êtes pas autorisé à signer ce bordereau pour cet acteur"
  );
}

export async function checkCanUpdateTransporterFields(user: User, form: Form) {
  const transporter = await getFirstTransporter(form);

  const authorizedOrgIds = [
    transporter?.transporterCompanySiret,
    transporter?.transporterCompanyVatNumber
  ].filter(Boolean);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanUpdate,
    "Vous n'êtes pas transporteur de ce bordereau."
  );
}

export async function checkCanMarkAsAccepted(user: User, form: Form) {
  if (EmitterType.APPENDIX1_PRODUCER === form.emitterType) {
    throw new ForbiddenError(
      "Un bordereau d'annexe 1 ne peut pas avoir être marqué comme accepté. Il suit son bordereau de tournée."
    );
  }
  const fullForm = await getFullForm(form);

  const recipientSiret = fullForm.forwardedIn
    ? fullForm.forwardedIn.recipientCompanySiret
    : form.recipientCompanySiret;

  return checkUserPermissions(
    user,
    [recipientSiret].filter(Boolean),
    Permission.BsdCanSignAcceptation,
    "Vous n'êtes pas autorisé à marquer ce bordereau comme accepté"
  );
}

export async function checkCanMarkAsReceived(user: User, form: Form) {
  if (EmitterType.APPENDIX1_PRODUCER === form.emitterType) {
    throw new ForbiddenError(
      "Un bordereau d'annexe 1 ne peut pas être marqué comme reçu. C'est la réception du bordereau de tournée qui mettra à jour le statut de ce bordereau."
    );
  }
  const fullForm = await getFullForm(form);

  const recipientSiret = fullForm.forwardedIn
    ? fullForm.forwardedIn.recipientCompanySiret
    : form.recipientCompanySiret;

  return checkUserPermissions(
    user,
    [recipientSiret].filter(Boolean),
    Permission.BsdCanSignAcceptation,
    "Vous n'êtes pas autorisé à réceptionner ce bordereau"
  );
}

export async function checkCanMarkAsTempStored(user: User, form: Form) {
  if (EmitterType.APPENDIX1_PRODUCER === form.emitterType) {
    throw new ForbiddenError(
      "Un bordereau d'annexe 1 ne peut pas avoir d'entreposage provisoire. Il suit son bordereau de tournée."
    );
  }

  return checkUserPermissions(
    user,
    [form.recipientCompanySiret].filter(Boolean),
    Permission.BsdCanSignAcceptation,
    "Vous n'êtes pas autorisé à marquer ce bordereau comme entreposé provisoirement"
  );
}

export async function checkCanMarkAsResealed(user: User, form: Form) {
  return checkUserPermissions(
    user,
    [form.recipientCompanySiret].filter(Boolean),
    Permission.BsdCanUpdate,
    "Vous n'êtes pas autorisé à sceller ce bordereau après entreposage provisoire"
  );
}

export async function checkCanMarkAsProcessed(user: User, form: Form) {
  if (EmitterType.APPENDIX1_PRODUCER === form.emitterType) {
    throw new ForbiddenError(
      "Un bordereau d'annexe 1 ne peut pas avoir être marqué comme traité. Il suit son bordereau de tournée."
    );
  }

  const fullForm = await getFullForm(form);

  const authorizedOrgIds = fullForm.forwardedIn
    ? [
        fullForm.forwardedIn.recipientCompanySiret,
        // case when the temp storer decides to do an anticipated treatment
        ...(form.status === Status.TEMP_STORER_ACCEPTED
          ? [form.recipientCompanySiret]
          : [])
      ]
    : [form.recipientCompanySiret];

  return checkUserPermissions(
    user,
    authorizedOrgIds.filter(Boolean),
    Permission.BsdCanSignOperation,
    "Vous n'êtes pas autorisé à marquer ce bordereau comme traité"
  );
}

export async function checkCanMarkAsResent(user: User, form: Form) {
  return checkUserPermissions(
    user,
    [form.recipientCompanySiret].filter(Boolean),
    Permission.BsdCanSignEmission,
    "Vous n'êtes pas autorisé à marquer ce borderau comme envoyé après entreposage provisoire"
  );
}

export async function checkCanImportForm(
  user: User,
  input: ImportPaperFormInput,
  form?: Form | null
) {
  const authorizedOrgIds =
    form && form.recipientCompanySiret
      ? [form.recipientCompanySiret]
      : [input.recipient?.company?.siret];

  return checkUserPermissions(
    user,
    authorizedOrgIds.filter(Boolean),
    Permission.BsdCanCreate,
    "Vous devez apparaitre en tant que destinataire du bordereau (case 2) pour pouvoir importer ce bordereau"
  );
}

export async function checkCanRequestRevision(user: User, form: Form) {
  const fullForm = await getFullForm(form);
  const authorizedOrgIds = [
    fullForm.emitterCompanySiret,
    fullForm.recipientCompanySiret,
    fullForm.ecoOrganismeSiret,
    fullForm.forwardedIn?.recipientCompanySiret
  ].filter(Boolean);

  return checkUserPermissions(
    user,
    authorizedOrgIds,
    Permission.BsdCanRevise,
    "Vous n'êtes pas autorisé à réviser ce bordereau"
  );
}

export async function hasSignatureAutomation({
  signedBy,
  signedFor
}: {
  signedBy: string;
  signedFor: string;
}) {
  const firstMatchingAutomation = await prisma.signatureAutomation.findFirst({
    where: { from: { siret: signedFor }, to: { siret: signedBy } }
  });

  return firstMatchingAutomation != null;
}
