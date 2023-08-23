import { Form, Prisma, Status } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  ImportPaperFormInput,
  MutationResolvers
} from "../../../generated/graphql/types";
import { getFirstTransporter, getFormOrFormNotFound } from "../../database";
import {
  getAndExpandFormFromDb,
  flattenImportPaperFormInput,
  flattenTransporterInput
} from "../../converter";
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
import { UserInputError } from "../../../common/errors";

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
  const flattenedTransporter = flattenTransporterInput(input);

  const existingTransporter = await getFirstTransporter(form);
  const validationData = {
    ...form,
    ...flattenedFormInput,
    ...existingTransporter,
    ...flattenedTransporter,
    isAccepted: flattenedFormInput.wasteAcceptationStatus === "ACCEPTED"
  };

  await processedFormSchema.validate(validationData, { abortEarly: false });

  // prevent overwriting company sirets
  const {
    emitterCompanySiret,
    recipientCompanySiret,
    traderCompanySiret,
    brokerCompanySiret,
    transporterCompanySiret
  } = validationData;

  if (
    emitterCompanySiret != form.emitterCompanySiret ||
    recipientCompanySiret != form.recipientCompanySiret ||
    transporterCompanySiret != existingTransporter?.transporterCompanySiret ||
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
    signedByTransporter: true,
    emittedAt: flattenedFormInput.sentAt,
    emittedBy: flattenedFormInput.sentBy,
    takenOverAt: flattenedFormInput.sentAt,
    ...(existingTransporter
      ? {
          transporters: {
            update: {
              where: { id: existingTransporter.id },
              data: flattenedTransporter
            }
          }
        }
      : {
          transporters: {
            create: {
              ...flattenedTransporter,
              number: 1,
              readyToTakeOver: true
            }
          }
        })
  };

  return getFormRepository(user).update(
    { id: form.id },
    {
      status: transitionForm(form, {
        type: EventType.ImportPaperForm,
        formUpdateInput
      }),
      ...formUpdateInput
    }
  );
}

/**
 * Create a form from scratch based on imported data
 * A customId corresponding to paper form number should be provided
 */
async function createForm(input: ImportPaperFormInput, user: Express.User) {
  const flattenedFormInput = flattenImportPaperFormInput(input);
  const flattenedTransporter = flattenTransporterInput(input);

  await processedFormSchema.validate(
    { ...flattenedFormInput, ...flattenedTransporter },
    {
      abortEarly: false
    }
  );

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
    signedByTransporter: true,
    ...(input.transporter
      ? {
          transporters: {
            create: {
              ...flattenedTransporter,
              number: 1,
              readyToTakeOver: true
            }
          }
        }
      : {})
  };

  const formRepository = getFormRepository(user);
  return formRepository.create(formCreateInput, { isPaperForm: true });
}

async function createOrUpdateForm(
  id: string | null | undefined,
  formInput: ImportPaperFormInput,
  user: Express.User
) {
  const form = id ? await getFormOrFormNotFound({ id }) : null;
  await checkCanImportForm(user, formInput, form);
  return form ? updateForm(form, formInput, user) : createForm(formInput, user);
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

  const form = await createOrUpdateForm(id, formInput, user);

  return getAndExpandFormFromDb(form.id);
};

export default importPaperFormResolver;
