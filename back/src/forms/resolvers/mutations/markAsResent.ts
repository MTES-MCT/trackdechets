import {
  MutationResolvers,
  MutationMarkAsResentArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { GraphQLContext } from "../../../types";
import { flattenResentFormInput } from "../../form-converter";
import transitionForm from "../../workflow/transitionForm";
import { Form, prisma } from "../../../generated/prisma-client";
import { checkCanMarkAsResent } from "../../permissions";
import { UserInputError } from "apollo-server-express";
import { validateTransporter } from "../../validation";
import { PROCESSING_OPERATIONS_CODES } from "../../../common/constants";
import { InvalidProcessingOperation } from "../../errors";

async function hasFinalDestination(form: Form) {
  const temporaryStorageDetail = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();

  const mandatoryKeys = [
    "destinationCompanyName",
    "destinationCompanySiret",
    "destinationCompanyAddress",
    "destinationCompanyContact",
    "destinationCompanyPhone",
    "destinationCompanyMail"
  ];

  return mandatoryKeys.every(key => !!temporaryStorageDetail[key]);
}

function validateArgs(args: MutationMarkAsResentArgs) {
  const { resentInfos } = args;

  if (resentInfos.transporter) {
    validateTransporter(resentInfos.transporter);
  }

  if (resentInfos.destination) {
    const destination = resentInfos.destination;
    if (
      destination.processingOperation &&
      !PROCESSING_OPERATIONS_CODES.includes(destination.processingOperation)
    ) {
      throw new InvalidProcessingOperation();
    }
  }

  return args;
}

export function markAsResentFn(
  form: Form,
  { resentInfos }: MutationMarkAsResentArgs,
  context: GraphQLContext
) {
  const transformEventToFormParams = infos => ({
    temporaryStorageDetail: {
      update: {
        ...flattenResentFormInput(infos)
      }
    }
  });

  return transitionForm(
    form,
    { eventType: "MARK_RESENT", eventParams: resentInfos },
    context,
    transformEventToFormParams
  );
}

const markAsResentResolver: MutationResolvers["markAsResent"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resentInfos } = validateArgs(args);

  const form = await getFormOrFormNotFound({ id });

  if (!resentInfos.destination && !hasFinalDestination(form)) {
    throw new UserInputError(
      "Vous devez remplir la destination" +
        "après entreposage provisoire ou reconditionnement" +
        "pour pouvoir sceller ce bordereau"
    );
  }

  await checkCanMarkAsResent(user, form);

  return markAsResentFn(form, { id, resentInfos }, context);
};

export default markAsResentResolver;
