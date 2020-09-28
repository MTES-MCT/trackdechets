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
import { resealedFormSchema } from "../../validation";

export async function markAsResentFn(
  form: Form,
  { resentInfos }: MutationMarkAsResentArgs,
  context: GraphQLContext
) {
  return transitionForm(
    form,
    { eventType: "MARK_RESENT", eventParams: resentInfos },
    context,
    infos => ({
      temporaryStorageDetail: {
        update: flattenResentFormInput(infos)
      }
    })
  );
}

const markAsResentResolver: MutationResolvers["markAsResent"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resentInfos } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsResent(user, form);

  if (form.status === "TEMP_STORED") {
    const temporaryStorageDetail = await prisma
      .form({ id: form.id })
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

  return markAsResentFn(form, { id, resentInfos }, context);
};

export default markAsResentResolver;
