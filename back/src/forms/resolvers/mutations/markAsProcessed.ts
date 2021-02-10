import prisma from "../../../prisma";
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

const markAsProcessedResolver: MutationResolvers["markAsProcessed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, processedInfo } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsProcessed(user, form);

  const formUpdateInput = flattenProcessedFormInput(processedInfo);

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

  const formUpdateInputValidated = await processedInfoSchema.validate(
    formUpdateInput
  );

  const processedForm = await transitionForm(user, form, {
    type: EventType.MarkAsProcessed,
    formUpdateInput: formUpdateInputValidated
  });

  // mark appendix2Forms as PROCESSED
  const appendix2Forms = await prisma.form
    .findUnique({ where: { id: form.id } })
    .appendix2Forms();
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
