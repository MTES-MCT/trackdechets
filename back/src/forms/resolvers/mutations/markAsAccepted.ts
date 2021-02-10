import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../form-converter";
import { checkCanMarkAsAccepted } from "../../permissions";
import { acceptedInfoSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";

const markAsAcceptedResolver: MutationResolvers["markAsAccepted"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const { id, acceptedInfo } = args;
  const form = await getFormOrFormNotFound({ id });
  await checkCanMarkAsAccepted(user, form);

  const acceptedInfoValidated = await acceptedInfoSchema.validate(acceptedInfo);

  const acceptedForm = await transitionForm(user, form, {
    type: EventType.MarkAsAccepted,
    formUpdateInput: acceptedInfoValidated
  });

  return expandFormFromDb(acceptedForm);
};

export default markAsAcceptedResolver;
