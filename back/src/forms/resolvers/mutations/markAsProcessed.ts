import { Prisma, Status } from "@prisma/client";
import { PROCESSING_OPERATIONS } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import {
  expandFormFromDb,
  flattenProcessedFormInput
} from "../../form-converter";
import { checkCanMarkAsProcessed } from "../../permissions";
import { processedInfoSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { getFormRepository } from "../../repository";
import machine from "../../workflow/machine";
import prisma from "../../../prisma";

const markAsProcessedResolver: MutationResolvers["markAsProcessed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, processedInfo } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsProcessed(user, form);

  let formUpdateInput: Prisma.FormUpdateInput =
    flattenProcessedFormInput(processedInfo);
  processedInfoSchema.validateSync(formUpdateInput, { abortEarly: false });

  // set default value for processingOperationDescription
  const operation = PROCESSING_OPERATIONS.find(
    otherOperation =>
      otherOperation.code === processedInfo.processingOperationDone
  );
  formUpdateInput.processingOperationDescription =
    processedInfo.processingOperationDescription || operation?.description;

  if (
    formUpdateInput.nextDestinationCompanySiret &&
    !formUpdateInput.nextDestinationCompanyCountry
  ) {
    // only default to "FR" if there's an actual nextDestination
    // otherwise keep it empty to avoid filling a field for an object that doesn't exist
    formUpdateInput.nextDestinationCompanyCountry = "FR";
  }

  if (form.status === Status.TEMP_STORER_ACCEPTED) {
    // The form was flagged as temporary storage but the recipient decides to
    // fo a final treatement or a groupement
    formUpdateInput = {
      ...formUpdateInput,
      recipientIsTempStorage: false,
      forwardedIn: { delete: true }
    };
  } else if (!!form.forwardedInId) {
    // Processed info is applied on BSD suite
    formUpdateInput = {
      forwardedIn: {
        update: {
          status: machine.transition(Status.ACCEPTED, {
            type: EventType.MarkAsProcessed,
            formUpdateInput
          }).value as Status,
          ...formUpdateInput
        }
      }
    };
  }

  const appendix2Forms = await getFormRepository(user).findAppendix2FormsById(
    form.id
  );

  const processedForm = await prisma.$transaction(async transaction => {
    const { updateAppendix2Forms, update } = getFormRepository(
      user,
      transaction
    );

    const processedForm = await update(
      { id: form.id },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsProcessed,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    // mark appendix2Forms as PROCESSED
    if (appendix2Forms.length > 0) {
      await updateAppendix2Forms(appendix2Forms);
    }

    return processedForm;
  });

  return expandFormFromDb(processedForm);
};

export default markAsProcessedResolver;
