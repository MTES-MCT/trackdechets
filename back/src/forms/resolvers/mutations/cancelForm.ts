import { getFormOrFormNotFound } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { expandFormFromDb } from "../../form-converter";
import { UserInputError } from "apollo-server-express";
import { checkCanReadUpdateDeleteForm } from "../../permissions";
import { EventType } from "../../workflow/types";

const cancelFormResolver: MutationResolvers["cancelForm"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const form = await getFormOrFormNotFound({ id });

  await checkCanReadUpdateDeleteForm(user, form);

  if (form.status !== "SEALED") {
    const errMessage =
      "Seuls les bordereaux à l'état scellé (en attente d'enlèvement) peuvent être annulés";
    throw new UserInputError(errMessage);
  }

  const canceledForm = await transitionForm(user, form, {
    type: EventType.CancelForm
  });

  return expandFormFromDb(canceledForm);
};

export default cancelFormResolver;
