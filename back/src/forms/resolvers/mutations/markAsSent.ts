import {
  MutationResolvers,
  SentFormInput
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsSent } from "../../permissions";
import { Form } from "../../../generated/prisma-client";
import { GraphQLContext } from "../../../types";
import transitionForm from "../../workflow/transitionForm";
import { signingInfoSchema, checkCanBeSealed } from "../../validation";

export function markAsSentFn(
  form: Form,
  sentInfo: SentFormInput,
  context: GraphQLContext
) {
  // when form is sent, we store transporterCompanySiret as currentTransporterSiret to ease multimodal management
  return transitionForm(
    form,
    {
      eventType: "MARK_SENT",
      eventParams: sentInfo
    },
    context,
    infos => ({
      ...infos,
      currentTransporterSiret: form.transporterCompanySiret,
      signedByTransporter: false
    })
  );
}

const markAsSentResolver: MutationResolvers["markAsSent"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, sentInfo } = args;

  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsSent(user, form);

  if (form.status === "DRAFT") {
    // check it can be sealed
    await checkCanBeSealed(form);
  }

  // validate input
  await signingInfoSchema.validate(sentInfo);

  return markAsSentFn(form, sentInfo, context);
};

export default markAsSentResolver;
