import { GraphQLContext } from "../../../types";
import {
  prisma,
  TransportSegment as PrismaTransportSegment
} from "../../../generated/prisma-client";
import {
  TransportSegment,
  MutationPrepareSegmentArgs,
  MutationEditSegmentArgs,
  MutationMarkSegmentAsReadyToTakeOverArgs,
  MutationTakeOverSegmentArgs
} from "../../../generated/graphql/types";
import { getCurrentUserSirets } from "../../rules/permissions";
import { expandTransportSegmentFromDb } from "../../form-converter";
import { segmentSchema, takeOverInfoSchema } from "../../rules/schema";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";

const SEGMENT_NOT_FOUND = "Le segment de transport n'a pas été trouvé";
const FORM_NOT_FOUND_OR_NOT_ALLOWED =
  "Le bordereau n'a pas été trouvé ou vous ne disposez pas des permissions nécessaires";
const FORM_MUST_BE_SENT = "Le bordereau doit être envoyé";
const FORM_MUST_BE_DRAFT = "Le bordereau doit être en brouillon";
const SEGMENT_ALREADY_SEALED = "Ce segment de transport est déjà scellé";
const SEGMENTS_ALREADY_PREPARED =
  "Il y a d'autres segments après le votre, vous ne pouvez pas ajouter de segment";

type FormSiretsAndSegments = {
  recipientCompanySiret: string;
  status: string;
  emitterCompanySiret: string;
  transporterCompanySiret: string;
  traderCompanySiret: string;
  ecoOrganisme: { siret: string };
  temporaryStorageDetail: {
    destinationCompanySiret: string;
    transporterCompanySiret: string;
  };
  transportSegments: [{ transporterCompanySiret: string }];
  owner: { id: string };
  currentTransporterSiret: string;
  nextTransporterSiret: string;
  currentSegment: string;
};
const formFragment = `
fragment FormWithSegments on Form {
  id
  status
  readableId
  wasteDetailsCode
  wasteDetailsName
  wasteDetailsQuantity
  emitterCompanyName
  recipientCompanyName
  transporterCompanySiret
  transporterCompanyName
  transporterCompanyAddress
  transporterCompanyContact
  transporterCompanyPhone
  transporterCompanyMail
  transporterIsExemptedOfReceipt
  transporterReceipt
  transporterDepartment
  transporterValidityLimit
  transporterNumberPlate
  transporterCustomInfo
  transportSegments  {
    mode
  }
  owner {
    id
  }

  nextTransporterSiret
  currentTransporterSiret
}
`;

const getForm = async formId => {
  const form = await prisma
    .form({
      id: formId
    })
    .$fragment<FormSiretsAndSegments>(formFragment);

  return form;
};

function flattenSegmentForDb(
  input,
  previousKeys = [],
  dbObject = {}
): Partial<PrismaTransportSegment> {
  Object.keys(input).forEach(key => {
    if (
      input[key] &&
      !Array.isArray(input[key]) &&
      typeof input[key] === "object"
    ) {
      return flattenSegmentForDb(input[key], [...previousKeys, key], dbObject);
    }

    const objectKey = [...previousKeys, key]
      .map((k, i) => {
        if (i !== 0) {
          return k.charAt(0).toUpperCase() + k.slice(1);
        }

        return k;
      })
      .join("");
    dbObject[objectKey] = input[key];
  });
  return dbObject;
}

/**
 *
 * Prepare a new transport segment
 */
export async function prepareSegment(
  { id, siret, nextSegmentInfo }: MutationPrepareSegmentArgs,
  context: GraphQLContext
): Promise<TransportSegment> {
  const user = checkIsAuthenticated(context);

  const currentUserSirets = await getCurrentUserSirets(user.id, prisma);

  if (!currentUserSirets.includes(siret)) {
    throw new ForbiddenError(FORM_NOT_FOUND_OR_NOT_ALLOWED);
  }
  const nextSegmentPayload = flattenSegmentForDb(nextSegmentInfo);

  if (!nextSegmentPayload.transporterCompanySiret) {
    throw new ForbiddenError("Le siret est obligatoire");
  }
  // get form and segments
  const form = await getForm(id);
  if (!form) {
    throw new ForbiddenError(FORM_NOT_FOUND_OR_NOT_ALLOWED);
  }
  const transportSegments = await prisma.transportSegments({
    where: {
      form: { id: id }
    }
  });

  // user must be the currentTransporter or form owner
  const userIsOwner = user.id === form.owner.id;
  const userIsCurrentTransporter =
    !!form.currentTransporterSiret && siret === form.currentTransporterSiret;

  if (!userIsOwner && !userIsCurrentTransporter) {
    throw new ForbiddenError(
      "Vous ne disposez pas des permissions nécessaires"
    );
  }

  // segments can be created by transporters if form is SENT and they're currently in charge of the form
  const userIsForbiddenToPrepareSentForm =
    userIsCurrentTransporter && form.status !== "SENT";

  // segments can be created by form owners when form is draft
  const userIsForbiddenToPrepareDraftForm =
    userIsOwner && form.status !== "DRAFT";

  // as user can be transporter and form owner, we dont want to forbid at first failing condition
  if (userIsForbiddenToPrepareSentForm && userIsForbiddenToPrepareDraftForm) {
    if (userIsForbiddenToPrepareDraftForm) {
      throw new ForbiddenError(FORM_MUST_BE_DRAFT);
    }
    if (userIsForbiddenToPrepareDraftForm) {
      throw new ForbiddenError(FORM_MUST_BE_DRAFT);
    }
  }

  const lastSegment = !!transportSegments.length
    ? transportSegments.slice(-1)[0]
    : null;
  if (
    !!lastSegment &&
    (!lastSegment.takenOverAt || lastSegment.transporterCompanySiret !== siret)
  ) {
    throw new ForbiddenError(SEGMENTS_ALREADY_PREPARED);
  }

  if (!nextSegmentPayload.transporterCompanySiret) {
    throw new UserInputError("Le siret est obligatoire");
  }

  const segment = await prisma.createTransportSegment({
    form: { connect: { id } },

    ...nextSegmentPayload,
    previousTransporterCompanySiret: siret,
    segmentNumber: transportSegments.length + 1 // additional segments begin at index 1
  });
  await prisma.updateForm({
    where: { id },
    data: {
      nextTransporterSiret: nextSegmentPayload.transporterCompanySiret
    }
  });

  return expandTransportSegmentFromDb(segment);
}

type SegmentAndForm = {
  id;
  form;
  transporterCompanySiret: string;
  transporterCompanyName: string;
  transporterCompanyAddress: string;
  transporterCompanyContact: string;
  transporterCompanyPhone: string;
  transporterCompanyMail: string;
  transporterIsExemptedOfReceipt: boolean;
  transporterReceipt: string;
  transporterDepartment: string;
  transporterValidityLimit: string;
  transporterNumberPlate: string;
  mode: string;

  readyToTakeOver: boolean;

  takenOverAt: string;
  takenOverBy: string;
};

const segmentFragment = `
fragment SegmentWithForm on Form {
  transporterCompanySiret
  transporterCompanyName
  transporterCompanyAddress
  transporterCompanyContact
  transporterCompanyPhone
  transporterCompanyMail
  transporterIsExemptedOfReceipt
  transporterReceipt
  transporterDepartment
  transporterValidityLimit
  transporterNumberPlate
  mode
  readyToTakeOver
  takenOverAt
  takenOverBy

  form {
    id
  }

}
`;

export async function markSegmentAsReadyToTakeOver(
  { id }: MutationMarkSegmentAsReadyToTakeOverArgs,
  context: GraphQLContext
): Promise<TransportSegment> {
  const user = checkIsAuthenticated(context);

  const currentSegment = await prisma
    .transportSegment({ id })
    .$fragment<SegmentAndForm>(segmentFragment);

  if (!currentSegment) {
    throw new ForbiddenError(SEGMENT_NOT_FOUND);
  }
  const form = await getForm(currentSegment.form.id);

  if (form.status !== "SENT") {
    throw new ForbiddenError(FORM_MUST_BE_SENT);
  }
  const userSirets = await getCurrentUserSirets(user.id, prisma);

  if (!userSirets.includes(form.currentTransporterSiret)) {
    throw new ForbiddenError(FORM_NOT_FOUND_OR_NOT_ALLOWED);
  }

  if (currentSegment.readyToTakeOver) {
    throw new ForbiddenError(SEGMENT_ALREADY_SEALED);
  }

  const updatedSegment = await prisma.updateTransportSegment({
    where: { id },
    data: { readyToTakeOver: true }
  });

  return expandTransportSegmentFromDb(updatedSegment);
}

// when a waste is taken over
export async function takeOverSegment(
  { id, takeOverInfo }: MutationTakeOverSegmentArgs,
  context: GraphQLContext
): Promise<TransportSegment> {
  const user = checkIsAuthenticated(context);

  const inputErrors: string[] = await takeOverInfoSchema
    .validate(takeOverInfo, { abortEarly: false })
    .catch(err => err.errors);

  if (!!inputErrors.length) {
    throw new UserInputError(
      `Erreur, impossible de prendre en charge le bordereau car ces champs ne sont pas renseignés.\nErreur(s): ${inputErrors.join(
        "\n"
      )}`
    );
  }

  const currentSegment = await prisma
    .transportSegment({ id })
    .$fragment<SegmentAndForm>(segmentFragment);

  if (!currentSegment) {
    throw new ForbiddenError(SEGMENT_NOT_FOUND);
  }

  const form = await getForm(currentSegment.form.id);
  if (form.status !== "SENT") {
    throw new ForbiddenError(FORM_MUST_BE_SENT);
  }

  const userSirets = await getCurrentUserSirets(user.id, prisma);

  //   user must be the nextTransporter
  const nexTransporterIsFilled = !!form.nextTransporterSiret;
  if (
    !nexTransporterIsFilled ||
    (nexTransporterIsFilled &&
      !userSirets.includes(form.nextTransporterSiret)) ||
    !userSirets.includes(currentSegment.transporterCompanySiret)
  ) {
    throw new ForbiddenError(FORM_NOT_FOUND_OR_NOT_ALLOWED);
  }

  const segmentErrors: string[] = await segmentSchema
    .validate(currentSegment, { abortEarly: false })
    .catch(err => err.errors);

  if (!!segmentErrors.length) {
    throw new UserInputError(
      `Erreur, impossible de prendre en charge le bordereau car ces champs ne sont pas renseignés, veuillez editer le segment pour le prendre en charge.\nErreur(s): ${segmentErrors.join(
        "\n"
      )}`
    );
  }

  const updatedSegment = await prisma.updateTransportSegment({
    where: { id: id },
    data: takeOverInfo
  });

  await prisma.updateForm({
    where: { id: currentSegment.form.id },
    data: {
      currentTransporterSiret: currentSegment.transporterCompanySiret,
      nextTransporterSiret: ""
    }
  });

  return expandTransportSegmentFromDb(updatedSegment);
}

/**
 *
 * Edit an existing segment
 * Can be performed by form owner when in DRAFT state, everything is editable,
 * By current transporter if segment is not readyToTakeOver yet, everything is editable
 * By next transporter if segment is readyToTakeOver and not taken over, siret is not editable

 */
export async function editSegment(
  { id, siret: userSiret, nextSegmentInfo }: MutationEditSegmentArgs,
  context: GraphQLContext
): Promise<TransportSegment> {
  const user = checkIsAuthenticated(context);

  const currentSegment = await prisma
    .transportSegment({ id })
    .$fragment<SegmentAndForm>(segmentFragment);

  if (!currentSegment) {
    throw new ForbiddenError(SEGMENT_NOT_FOUND);
  }

  const nextSegmentPayload = flattenSegmentForDb(nextSegmentInfo);

  // check user owns siret
  const userSirets = await getCurrentUserSirets(user.id, prisma);
  if (!userSirets.includes(userSiret)) {
    throw new ForbiddenError(FORM_NOT_FOUND_OR_NOT_ALLOWED);
  }

  const form = await getForm(currentSegment.form.id);

  const userIsOwner = user.id === form.owner.id;
  const userIsCurrentTransporter = userSiret === form.currentTransporterSiret;
  const userIsNextTransporter = userSiret === form.nextTransporterSiret;

  // segments can be edited by form transporter when form is sent
  const transporterIsForbiddenToEditSentForm =
    userIsCurrentTransporter && form.status !== "SENT";

  // segments can be edited by form owners when form is draft
  const ownerIsForbiddenToEditDraftForm =
    userIsOwner && form.status !== "DRAFT";

  // current transporter can edit until segment is readyToTakeOver
  const currentTransporterIsForbiddenToEditReadyToTakeOverSegment =
    userIsCurrentTransporter && currentSegment.readyToTakeOver;

  // the first statement (!userIsCurrentTransporter) allows a transporter to edit segment if it is assigned to him
  const nextTransporterIsForbiddenToEditDraftSegment =
    !userIsCurrentTransporter &&
    userIsNextTransporter &&
    !currentSegment.readyToTakeOver;

  // as user can be transporter and form owner, we dont want to forbid at first failing condition
  if (
    transporterIsForbiddenToEditSentForm &&
    ownerIsForbiddenToEditDraftForm &&
    currentTransporterIsForbiddenToEditReadyToTakeOverSegment
  ) {
    if (transporterIsForbiddenToEditSentForm) {
      throw new ForbiddenError(FORM_MUST_BE_SENT);
    }
    if (ownerIsForbiddenToEditDraftForm) {
      throw new ForbiddenError(FORM_MUST_BE_DRAFT);
    }
    if (currentTransporterIsForbiddenToEditReadyToTakeOverSegment) {
      throw new ForbiddenError("Ce segment ne peut plus être modifié");
    }
    if (nextTransporterIsForbiddenToEditDraftSegment) {
      throw new ForbiddenError(
        "Ce segment ne peut pas être modifié tant qu'il n'est pas scellé par le tranporteur précédent"
      );
    }
  }

  // siret can't be edited once segment is marked as ready
  if (
    currentSegment.readyToTakeOver &&
    !!nextSegmentPayload.transporterCompanySiret &&
    nextSegmentPayload.transporterCompanySiret !==
      currentSegment.transporterCompanySiret
  ) {
    throw new ForbiddenError("Le siret ne peut pas être modifié");
  }

  const updatedSegment = await prisma.updateTransportSegment({
    where: { id },
    data: nextSegmentPayload
  });
  await prisma.updateForm({
    where: { id: currentSegment.form.id },
    data: {
      nextTransporterSiret: nextSegmentPayload.transporterCompanySiret
    }
  });
  return expandTransportSegmentFromDb(updatedSegment);
}
