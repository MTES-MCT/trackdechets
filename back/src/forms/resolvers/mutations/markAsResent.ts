import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb, flattenResentFormInput } from "../../form-converter";
import transitionForm from "../../workflow/transitionForm";
import prisma from "src/prisma";
import { checkCanMarkAsResent } from "../../permissions";
import { UserInputError } from "apollo-server-express";
import { resealedFormSchema } from "../../validation";
import { EventType } from "../../workflow/types";

const markAsResentResolver: MutationResolvers["markAsResent"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resentInfos } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsResent(user, form);

  if (form.status === "TEMP_STORER_ACCEPTED") {
    const temporaryStorageDetail = await prisma.form
      .findOne({ where: { id: form.id } })
      .temporaryStorageDetail();

    if (temporaryStorageDetail === null) {
      throw new UserInputError(
        "Ce bordereau ne correspond pas à un entreposage provisoire ou un reconditionnemnt"
      );
    }
    await resealedFormSchema.validate({
      ...temporaryStorageDetail,
      ...flattenResentFormInput(resentInfos)
    });
  }

  const formUpdateInput = {
    temporaryStorageDetail: {
      update: flattenResentFormInput(resentInfos)
    }
  };
  const resentForm = await transitionForm(user, form, {
    type: EventType.MarkAsResent,
    formUpdateInput
  });
  return expandFormFromDb(resentForm);
};

export default markAsResentResolver;
