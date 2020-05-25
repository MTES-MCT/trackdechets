import { GraphQLContext } from "../../types";
import { prisma } from "../../generated/prisma-client";
import { TransportSegment } from "../../generated/prisma-client";
import { getCurrentUserSirets } from "../rules/permissions";
import { unflattenObjectFromDb } from "../form-converter";
import {
  Form,
  MutationPrepareSegmentArgs,
} from "../../generated/graphql/types";
import isSegmentValidForTakeOver from "./segmentValidation";
import { ForbiddenError } from "apollo-server-express";

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

const getForm = async (formId) => {
  const form = await prisma
    .form({
      id: formId,
    })
    .$fragment<FormSiretsAndSegments>(formFragment);

  return form;
};

function flattenSegmentForDb(
  input,
  previousKeys = [],
  dbObject = {}
): Partial<TransportSegment> {
  Object.keys(input).forEach((key) => {
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
): Promise<Form> {
  const currentUserSirets = await getCurrentUserSirets(context.user.id, prisma);

  if (!currentUserSirets.includes(siret)) {
    throw "error";
  }

  const nextSegmentPayload = flattenSegmentForDb(nextSegmentInfo);

  if (!nextSegmentPayload.transporterCompanySiret) {
    throw new Error("Transporter siret is mandatory");
  }

  // get form and segments
  const form = await getForm(id);
  if (!form) {
    throw new ForbiddenError("Form not found or not allowed");
  }
  const transportSegments = await prisma.transportSegments({
    where: {
      transporterCompanySiret: nextSegmentPayload.transporterCompanySiret,
      form: { id: id },
    },
  });

  // retrieve segments transporter sirets
  const transportSegmentsSirets = transportSegments.map(
    (el) => el.transporterCompanySiret
  );

  //   user must be the currentTransporter or form owner
  const userIsOwner = context.user.id === form.owner.id;
  const userIsCurrentTransporter =
    !!form.currentTransporterSiret && siret === form.currentTransporterSiret;

  if (!userIsOwner && !userIsCurrentTransporter) {
    throw Error("You are not allowed to perform this mutation");
  }
  // segments can be created by transporters if formis SENT and they're currently in charge of the form
  if (userIsCurrentTransporter && form.status !== "SENT") {
    throw Error(
      "You can't perform this mutation on forms which are not in SENT state"
    );
  }

  // segments can be created by form owners when form is draft
  if (userIsOwner && form.status !== "DRAFT") {
    throw Error(
      "You can't perform this mutation on forms which are not in DRAFT state"
    );
  }
  const lastSegmentId = !!transportSegments.length
    ? transportSegments.slice(-1)[0].id
    : null;
  // segments can be edited by transporters if they're currently in charge of the form

  if (
    userIsCurrentTransporter &&
    !!transportSegments.length &&
    form.currentSegment !== lastSegmentId
  ) {
    throw Error(
      "There are scheduled segments after yours, you'can't add new segments"
    );
  }

  if (!nextSegmentPayload.transporterCompanySiret) {
    throw Error("");
  }

  await prisma.createTransportSegment({
    form: { connect: { id } },

    ...nextSegmentPayload,
    previousTransporterCompanySiret: siret,
  });
  const updatedForm = await prisma.updateForm({
    where: { id },
    data: {
      nextTransporterSiret: nextSegmentPayload.transporterCompanySiret,
    },
  });

  return unflattenObjectFromDb(updatedForm);
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

  sealed: boolean;

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
  sealed 
  takenOverAt 
  takenOverBy 
  
  form {
    id
  }
   
}
`;

export async function markSegmentAsSealed({ id }, context: GraphQLContext) {
  const currentSegment = await prisma
    .transportSegment({ id })
    .$fragment<SegmentAndForm>(segmentFragment);

  if (!currentSegment) {
    throw new ForbiddenError("Segment not found or not allowed");
  }
  const form = await getForm(currentSegment.form.id);

  if (form.status !== "SENT") {
    throw Error("Form must be in SENT state");
  }
  const userSirets = await getCurrentUserSirets(context.user.id, prisma);

  if (!userSirets.includes(form.currentTransporterSiret)) {
    throw Error("You must be the current transporter");
  }

  if (currentSegment.sealed) {
    throw Error("This segment is already marked as sealed");
  }

  await prisma.updateTransportSegment({
    where: { id },
    data: { sealed: true },
  });

  return unflattenObjectFromDb(form);
}

// when a waste is taken over
export async function takeOverSegment(
  { id, takeOverInfo },
  context: GraphQLContext
) {
  // PERMISSIONS !!!

  const currentSegment = await prisma
    .transportSegment({ id })
    .$fragment<SegmentAndForm>(segmentFragment);

  const form = await getForm(currentSegment.form.id);
  if (form.status !== "SENT") {
    throw Error("Form must be in SENT state");
  }

  const userSirets = await getCurrentUserSirets(context.user.id, prisma);

  //   user must be the nextTransporter
  const nexTransporterIsFilled = !!form.nextTransporterSiret;
  if (
    !nexTransporterIsFilled ||
    (nexTransporterIsFilled &&
      !userSirets.includes(form.nextTransporterSiret)) ||
    !userSirets.includes(currentSegment.transporterCompanySiret)
  ) {
    throw Error("You are not the next transporter on this form");
  }

  await isSegmentValidForTakeOver(currentSegment);

  await prisma.updateTransportSegment({
    where: { id: id },
    data: takeOverInfo,
  });

  const updatedForm = await prisma.updateForm({
    where: { id: currentSegment.form.id },
    data: {
      currentTransporterSiret: currentSegment.transporterCompanySiret,
      nextTransporterSiret: "",
      // currentSegment: currentSegment.id,
    },
  });

  return unflattenObjectFromDb(updatedForm);
}

/**
 * 
 * Edit an existing segment
 * Can be performed by form owner when in DRAFT state, 
 * By current transporter if segment is not sealed yet
 * By next transporter if segment is sealed and not taken over
  
 */
export async function editSegment(
  { id, siret: userSiret, nextSegmentInfo },
  context: GraphQLContext
) {
  const currentSegment = await prisma
    .transportSegment({ id })
    .$fragment<SegmentAndForm>(segmentFragment);

  if (!currentSegment) {
    throw Error("Not found");
  }

  if (currentSegment.sealed) {
    throw Error("You can't perform this mutation on a sealed segment");
  }

  const nextSegmentPayload = flattenSegmentForDb(nextSegmentInfo);

  // check user owns siret
  const userSirets = await getCurrentUserSirets(context.user.id, prisma);
  if (!userSirets.includes(userSiret)) {
    throw Error("you re not allowed");
  }

  const form = await getForm(currentSegment.form.id);

  const userIsOwner = context.user.id === form.owner.id;
  const userIsCurrentTransporter = userSiret === form.currentTransporterSiret;
  const userIsNextTransporter = userSiret === form.nextTransporterSiret;

  if (
    (userIsCurrentTransporter || userIsNextTransporter) &&
    form.status !== "SENT"
  ) {
    throw Error(
      "You can't perform this mutation on forms which are not in SENT state"
    );
  }

  // segments can be edited by form owners when form is draft

  if (userIsOwner && form.status !== "DRAFT") {
    throw Error(
      "You can't perform this mutation on forms which are not in DRAFT state"
    );
  }
  // current transporter can edit until segment is sealed
  if (userIsCurrentTransporter && currentSegment.sealed) {
    throw Error("Take over can not be edited anymore");
  }
  // next transporter can edit when segment is sealed
  if (userIsNextTransporter && !currentSegment.sealed) {
    throw Error("Take over can not be edited yet");
  }

  if (currentSegment.sealed && !!nextSegmentPayload.transporterCompanySiret) {
    throw Error("Siret can not be changed anymore");
  }

  await prisma.updateTransportSegment({
    where: { id },
    data: nextSegmentPayload,
  });

  return unflattenObjectFromDb(form);
}
