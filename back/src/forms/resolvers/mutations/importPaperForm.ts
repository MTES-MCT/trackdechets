import { Form, Prisma, User } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  ImportPaperFormInput,
  MutationResolvers
} from "../../../generated/graphql/types";
import { getCachedUserSirets } from "../../../common/redis/users";
import { getFormOrFormNotFound, getFullForm } from "../../database";
import {
  expandFormFromDb,
  flattenImportPaperFormInput
} from "../../form-converter";
import { checkCanImportForm } from "../../permissions";
import getReadableId from "../../readableId";
import { processedFormSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { indexForm } from "../../elastic";

/**
 * Update an existing form with data imported from a paper form
 * Only SEALED form can be updated and marked as processed
 * which is reflected in the state machine
 */
async function updateForm(user: User, form: Form, input: ImportPaperFormInput) {
  // fail fast on form.status (before state machine validation) to ensure
  // we apply validation on a sealed form
  if (form.status !== "SEALED") {
    throw new UserInputError(
      `Seul un BSD à l'état "scellé" (SEALED) peut être mis à jour à partir d'un BSD papier`
    );
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
async function createForm(user: User, input: ImportPaperFormInput) {
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

  const formCreateInput: Prisma.FormCreateInput = {
    ...flattenedFormInput,
    readableId: getReadableId(),
    owner: { connect: { id: user.id } },
    status: "PROCESSED",
    isImportedFromPaper: true,
    signedByTransporter: true
  };

  return prisma.form.create({ data: formCreateInput });
}

async function createOrUpdateForm(
  user: User,
  id: string,
  formInput: ImportPaperFormInput
) {
  if (id) {
    const form = await getFormOrFormNotFound({ id });
    await checkCanImportForm(user, form);
    return updateForm(user, form, formInput);
  }

  return createForm(user, formInput);
}

const importPaperFormResolver: MutationResolvers["importPaperForm"] = async (
  parent,
  { input: { id, ...rest } },
  context
) => {
  const user = checkIsAuthenticated(context);

  // add defaults values where needed/possible
  const formInput: ImportPaperFormInput = {
    ...rest,
    wasteDetails: rest.wasteDetails
      ? { pop: false, ...rest.wasteDetails }
      : rest.wasteDetails
  };

  const form = await createOrUpdateForm(user, id, formInput);

  const fullForm = await getFullForm(form);
  await indexForm(fullForm, context);

  return expandFormFromDb(form);
};

export default importPaperFormResolver;
