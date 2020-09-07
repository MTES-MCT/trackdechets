import { getFormOrFormNotFound } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanMarkAsSealed } from "../../permissions";
import { GraphQLContext } from "../../../types";
import { Form } from "../../../generated/prisma-client";
import { checkCanBeSealed } from "../../validation";

export function markAsSealedFn(form: Form, context: GraphQLContext) {
  return transitionForm(form, { eventType: "MARK_SEALED" }, context);
}

const markAsSealedResolver: MutationResolvers["markAsSealed"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const form = await getFormOrFormNotFound({ id });
  await checkCanMarkAsSealed(user, form);
  await checkCanBeSealed(form);
  return markAsSealedFn(form, context);
};

export default markAsSealedResolver;
