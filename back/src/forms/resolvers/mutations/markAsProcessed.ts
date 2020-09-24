import {
  MutationResolvers,
  MutationMarkAsProcessedArgs
} from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { GraphQLContext } from "../../../types";
import transitionForm from "../../workflow/transitionForm";
import { flattenProcessedFormInput } from "../../form-converter";
import { Form, FormUpdateInput } from "../../../generated/prisma-client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanMarkAsProcessed } from "../../permissions";
import { processedInfoSchema } from "../../validation";
import { PROCESSING_OPERATIONS } from "../../../common/constants";

export async function markAsProcessedFn(
  form: Form,
  { processedInfo }: MutationMarkAsProcessedArgs,
  context: GraphQLContext
) {
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

  return transitionForm(
    form,
    { eventType: "MARK_PROCESSED", eventParams: processedInfo },
    context,
    () => formUpdateInput
  );
}

const markAsProcessedResolver: MutationResolvers["markAsProcessed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, processedInfo } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsProcessed(user, form);

  return markAsProcessedFn(form, { id, processedInfo }, context);
};

export default markAsProcessedResolver;
