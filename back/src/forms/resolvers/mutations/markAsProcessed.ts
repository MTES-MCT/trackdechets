import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import {
  expandFormFromDb,
  flattenProcessedFormInput
} from "../../form-converter";
import { FormUpdateInput, prisma } from "../../../generated/prisma-client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanMarkAsProcessed } from "../../permissions";
import { processedInfoSchema } from "../../validation";
import { PROCESSING_OPERATIONS } from "../../../common/constants";
import { EventType } from "../../workflow/types";

const markAsProcessedResolver: MutationResolvers["markAsProcessed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, processedInfo } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsProcessed(user, form);

  const formUpdateInput: FormUpdateInput = flattenProcessedFormInput(
    processedInfo
  );
  await processedInfoSchema.validate(formUpdateInput);

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

  // mark appendix2Forms as PROCESSED
  const appendix2Forms = await prisma.form({ id: form.id }).appendix2Forms();
  if (appendix2Forms.length > 0) {
    const promises = appendix2Forms.map(appendix => {
      return transitionForm(user, appendix, {
        type: EventType.MarkAsProcessed
      });
    });
    await Promise.all(promises);
  }

  return expandFormFromDb(processedForm);
};

export default markAsProcessedResolver;
