import {
  MutationResolvers,
  MutationMarkAsResealedArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { flattenResealedFormInput } from "../../form-converter";
import { checkCanMarkAsResealed } from "../../permissions";
import transitionForm from "../../workflow/transitionForm";
import { validateTransporter } from "../../validation";
import { InvalidProcessingOperation } from "../../errors";
import { PROCESSING_OPERATIONS_CODES } from "../../../common/constants";
import { prisma, Form } from "../../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";

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

function validateArgs(args: MutationMarkAsResealedArgs) {
  const { resealedInfos } = args;

  if (resealedInfos.transporter) {
    const transporter = resealedInfos.transporter;
    validateTransporter(transporter);
  }

  if (resealedInfos.destination) {
    const destination = resealedInfos.destination;
    if (
      destination.processingOperation &&
      !PROCESSING_OPERATIONS_CODES.includes(destination.processingOperation)
    ) {
      throw new InvalidProcessingOperation();
    }
  }

  return args;
}

const markAsResealed: MutationResolvers["markAsResealed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resealedInfos } = validateArgs(args);

  const form = await getFormOrFormNotFound({ id });

  if (!resealedInfos.destination && !hasFinalDestination(form)) {
    throw new UserInputError(
      "Vous devez remplir la destination" +
        "après entreposage provisoire ou reconditionnement" +
        "pour pouvoir sceller ce bordereau"
    );
  }

  await checkCanMarkAsResealed(user, form);

  const transformEventToFormParams = infos => ({
    temporaryStorageDetail: {
      update: flattenResealedFormInput(infos)
    }
  });

  return transitionForm(
    form,
    { eventType: "MARK_RESEALED", eventParams: resealedInfos },
    context,
    transformEventToFormParams
  );
};

export default markAsResealed;
