import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { flattenResealedFormInput } from "../../form-converter";
import { checkCanMarkAsResealed } from "../../permissions";
import transitionForm from "../../workflow/transitionForm";
import { prisma } from "../../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";
import { resealedFormSchema } from "../../validation";

const markAsResealed: MutationResolvers["markAsResealed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resealedInfos } = args;

  const form = await getFormOrFormNotFound({ id });

  const temporaryStorageDetail = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();

  if (temporaryStorageDetail === null) {
    throw new UserInputError(
      "Ce bordereau ne correspond pas à un entreposage provisoire ou un reconditionnemnt"
    );
  }

  await checkCanMarkAsResealed(user, form);

  const updateInput = flattenResealedFormInput(resealedInfos);

  // validate input
  await resealedFormSchema.validate({
    ...temporaryStorageDetail,
    ...updateInput
  });

  return transitionForm(
    form,
    { eventType: "MARK_RESEALED", eventParams: resealedInfos },
    context,
    () => ({
      temporaryStorageDetail: {
        update: updateInput
      }
    })
  );
};

export default markAsResealed;
