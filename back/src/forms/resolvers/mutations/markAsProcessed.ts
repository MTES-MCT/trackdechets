import {
  MutationResolvers,
  MutationMarkAsProcessedArgs
} from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { GraphQLContext } from "../../../types";
import {
  PROCESSING_OPERATIONS,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES
} from "../../../common/constants";
import { UserInputError } from "apollo-server-express";
import transitionForm from "../../workflow/transitionForm";
import { flattenProcessedFormInput } from "../../form-converter";
import { Form } from "../../../generated/prisma-client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { isValidDatetime, validateCompany } from "../../validation";
import { InvalidDateTime } from "../../../common/errors";
import { checkCanMarkAsProcessed } from "../../permissions";
import { InvalidProcessingOperation } from "../../errors";

function validateArgs(args: MutationMarkAsProcessedArgs) {
  const { processedInfo } = args;

  const operation = PROCESSING_OPERATIONS.find(
    otherOperation =>
      otherOperation.code === processedInfo.processingOperationDone
  );

  if (operation == null) {
    throw new InvalidProcessingOperation();
  } else {
    // set default value for processingOperationDescription
    args.processedInfo.processingOperationDescription =
      processedInfo.processingOperationDescription || operation.description;
  }

  if (
    PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(
      processedInfo.processingOperationDone
    ) &&
    !processedInfo.nextDestination
  ) {
    throw new UserInputError(
      `Vous devez saisir une destination ultérieure prévue pour l'opération de regroupement ${processedInfo.processingOperationDone}`
    );
  }

  if (processedInfo.nextDestination) {
    const { company } = processedInfo.nextDestination;
    validateCompany(company, {
      verboseFieldName: "Destination ultérieure prévue",
      allowForeign: true
    });
  }

  if (!isValidDatetime(processedInfo.processedAt)) {
    throw new InvalidDateTime("processedAt");
  }

  return args;
}

export function markAsProcessedFn(
  form: Form,
  { processedInfo }: MutationMarkAsProcessedArgs,
  context: GraphQLContext
) {
  return transitionForm(
    form,
    { eventType: "MARK_PROCESSED", eventParams: processedInfo },
    context,
    infos => flattenProcessedFormInput(infos)
  );
}

const markAsProcessedResolver: MutationResolvers["markAsProcessed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, processedInfo } = validateArgs(args);

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsProcessed(user, form);

  return markAsProcessedFn(form, { id, processedInfo }, context);
};

export default markAsProcessedResolver;
