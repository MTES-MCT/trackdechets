import { Prisma } from "@prisma/client";
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

const markAsProcessedResolver: MutationResolvers["markAsProcessed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, processedInfo } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsProcessed(user, form);

  const formUpdateInput: Prisma.FormUpdateInput =
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

  const processedForm = await transitionForm(user, form, {
    type: EventType.MarkAsProcessed,
    formUpdateInput
  });

  const { findAppendix2FormsById, updateAppendix2Forms } =
    getFormRepository(user);

  // mark appendix2Forms as PROCESSED
  const appendix2Forms = await findAppendix2FormsById(form.id);

  if (appendix2Forms.length > 0) {
    await updateAppendix2Forms(appendix2Forms);
  }

  return expandFormFromDb(processedForm);
};

export default markAsProcessedResolver;
