import { Form, Prisma, Status } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCachedUserSirets } from "../../../common/redis/users";
import {
  ImportPaperFormInput,
  MutationResolvers
} from "@trackdechets/codegen/src/back.gen";
import { getFormOrFormNotFound } from "../../database";
import {
  expandFormFromDb,
  flattenImportPaperFormInput
} from "../../form-converter";
import { checkCanImportForm } from "../../permissions";
import getReadableId from "../../readableId";
import { getFormRepository } from "../../repository";
import { processedFormSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import {
  isDangerous,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES
} from "../../../common/constants";

/**
 * Update an existing form with data imported from a paper form
 * Only SEALED form can be updated and marked as processed
 * which is reflected in the state machine
 */
async function updateForm(
  form: Form,
  input: ImportPaperFormInput,
  user: Express.User
) {
  // fail fast on form.status (before state machine validation) to ensure
  // we apply validation on a sealed form
  if (form.status !== "SEALED") {
    throw new UserInputError(
      `Seul un BSD à l'état "scellé" (SEALED) peut être mis à jour à partir d'un BSD papier`
    );
  }

  if (
    input.wasteDetails?.code &&
    isDangerous(input.wasteDetails?.code) &&
    input.wasteDetails?.isDangerous === undefined
  ) {
    input.wasteDetails.isDangerous = true;
  }

  const flattenedFormInput = flattenImportPaperFormInput(input);
  const validationData = { ...form, ...flattenedFormInput };

  await processedFormSchema.validate(validationData, { abortEarly: false });

  // prevent overwriting company sirets
  const {
    emitterCompanySiret,
    recipientCompanySiret,
    transporterCompanySiret,
    traderCompanySiret,
    brokerCompanySiret
  } = validationData;

  if (
    emitterCompanySiret != form.emitterCompanySiret ||
    recipientCompanySiret != form.recipientCompanySiret ||
    transporterCompanySiret != form.transporterCompanySiret ||
    traderCompanySiret != form.traderCompanySiret ||
    brokerCompanySiret != form.brokerCompanySiret
  ) {
    throw new UserInputError(
      "Vous ne pouvez pas mettre à jour les numéros SIRET des établissements présents sur le BSD"
    );
  }

  const formUpdateInput: Prisma.FormUpdateInput = {
    ...flattenedFormInput,
    isImportedFromPaper: true,
    signedByTransporter: true
  };

  return transitionForm(user, form, {
    type: EventType.ImportPaperForm,
    formUpdateInput
  });
}

/**
 * Create a form from scratch based on imported data
 * A customId corresponding to paper form number should be provided
 */
async function createForm(input: ImportPaperFormInput, user: Express.User) {
  const flattenedFormInput = flattenImportPaperFormInput(input);

  await processedFormSchema.validate(flattenedFormInput, {
    abortEarly: false
  });

  // check user belongs to destination company
  const userSirets = await getCachedUserSirets(user.id);
  if (!userSirets.includes(flattenedFormInput.recipientCompanySiret)) {
    throw new UserInputError(
      "Vous devez apparaitre en tant que destinataire du bordereau (case 2) pour pouvoir importer ce bordereau"
    );
  }

  const noTraceability = input.processedInfo?.noTraceability === true;
  const awaitingGroup = PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(
    input.processedInfo?.processingOperationDone
  );

  const formCreateInput: Prisma.FormCreateInput = {
    ...flattenedFormInput,
    readableId: getReadableId(),
    owner: { connect: { id: user.id } },
    status: noTraceability
      ? Status.NO_TRACEABILITY
      : awaitingGroup
      ? Status.AWAITING_GROUP
      : Status.PROCESSED,
    isImportedFromPaper: true,
    signedByTransporter: true
  };

  const formRepository = getFormRepository(user);
  return formRepository.create(formCreateInput, { isPaperForm: true });
}

async function createOrUpdateForm(
  id: string,
  formInput: ImportPaperFormInput,
  user: Express.User
) {
  if (id) {
    const form = await getFormOrFormNotFound({ id });
    await checkCanImportForm(user, form);
    return updateForm(form, formInput, user);
  }

  return createForm(formInput, user);
}

const importPaperFormResolver: MutationResolvers["importPaperForm"] = async (
  parent,
  { input: { id, ...rest } },
  context
) => {
  checkIsAuthenticated(context);

  // add defaults values where needed/possible
  const formInput: ImportPaperFormInput = {
    ...rest,
    wasteDetails: rest.wasteDetails
      ? { pop: false, ...rest.wasteDetails }
      : rest.wasteDetails
  };

  const form = await createOrUpdateForm(id, formInput, context.user);

  return expandFormFromDb(form);
};

export default importPaperFormResolver;
