import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  ImportPaperFormInput,
  MutationResolvers
} from "../../../generated/graphql/types";
import {
  Form,
  FormCreateInput,
  FormUpdateInput,
  prisma,
  User
} from "../../../generated/prisma-client";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import {
  getEcoOrganismeOrNotFound,
  getFormOrFormNotFound
} from "../../database";
import {
  expandFormFromDb,
  flattenImportPaperFormInput
} from "../../form-converter";
import { checkCanImportForm } from "../../permissions";
import { getReadableId } from "../../readable-id";
import { processedFormSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";

/**
 * Update an existing form with data imported from a paper form
 * Only SEALED form can be updated and marked as processed
 * which is reflected in the state machine
 */
async function updateForm(
  form: Form,
  input: ImportPaperFormInput,
  context: GraphQLContext
) {
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
    traderCompanySiret
  } = validationData;

  if (
    emitterCompanySiret != form.emitterCompanySiret ||
    recipientCompanySiret != form.recipientCompanySiret ||
    transporterCompanySiret != form.transporterCompanySiret ||
    traderCompanySiret != form.traderCompanySiret
  ) {
    throw new UserInputError(
      "Vous ne pouvez pas mettre à jour les numéros SIRET des établissements présents sur le BSD"
    );
  }

  const formUpdateInput: FormUpdateInput = {
    ...flattenedFormInput,
    isImportedFromPaper: true,
    signedByTransporter: true,
    ...(input.ecoOrganisme
      ? {
          ecoOrganisme: {
            connect: {
              id: await getEcoOrganismeOrNotFound(input.ecoOrganisme).then(
                e => e.id
              )
            }
          }
        }
      : {})
  };

  return transitionForm(
    form,
    {
      eventType: "IMPORT_PAPER_FORM",
      eventParams: formUpdateInput
    },
    context
  );
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
  const userCompanies = await getUserCompanies(user.id);
  const userSirets = userCompanies.map(c => c.siret);
  if (!userSirets.includes(flattenedFormInput.recipientCompanySiret)) {
    throw new UserInputError(
      "Vous devez apparaitre en tant que destinataire du bordereau (case 2) pour pouvoir importer ce bordereau"
    );
  }

  const formCreateInput: FormCreateInput = {
    ...flattenedFormInput,
    readableId: await getReadableId(),
    owner: { connect: { id: user.id } },
    ...(input.ecoOrganisme
      ? {
          ecoOrganisme: {
            connect: {
              id: await getEcoOrganismeOrNotFound(input.ecoOrganisme).then(
                e => e.id
              )
            }
          }
        }
      : {}),
    status: "PROCESSED",
    isImportedFromPaper: true,
    signedByTransporter: true
  };

  const form = await prisma.createForm(formCreateInput);
  return expandFormFromDb(form);
}

const importPaperFormResolver: MutationResolvers["importPaperForm"] = async (
  parent,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);

  if (input.id) {
    // update existing form
    const { id, ...formInput } = input;
    const form = await getFormOrFormNotFound({ id });
    await checkCanImportForm(user, form);
    return updateForm(form, formInput, context);
  } else {
    // create new form
    return createForm(user, input);
  }
};

export default importPaperFormResolver;
