import * as yup from "yup";
import {
  MutationResolvers,
  MutationMarkAsSentArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsSent } from "../../permissions";
import { Form } from "../../../generated/prisma-client";
import { GraphQLContext } from "../../../types";
import transitionForm from "../../workflow/transitionForm";
import { validDatetime } from "../../validation";

export const sentInfovalidationSchema = yup.object().shape({
  sentAt: validDatetime(
    {
      verboseFieldName: "date d'envoi",
      required: true
    },
    yup
  )
});

export function markAsSentFn(
  form: Form,
  args: MutationMarkAsSentArgs,
  context: GraphQLContext
) {
  // when form is sent, we store transporterCompanySiret as currentTransporterSiret to ease multimodal management
  return transitionForm(
    form,
    { eventType: "MARK_SENT", eventParams: args.sentInfo },
    context,
    infos => ({
      ...infos,
      currentTransporterSiret: form.transporterCompanySiret
    })
  );
}

const markAsSentResolver: MutationResolvers["markAsSent"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  sentInfovalidationSchema.validateSync(args.sentInfo);

  const form = await getFormOrFormNotFound({ id: args.id });

  await checkCanMarkAsSent(user, form);

  return markAsSentFn(form, args, context);
};

export default markAsSentResolver;
