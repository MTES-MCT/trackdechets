import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { getFormOrFormNotFound } from "../../database";
import {
  HasSegmentToTakeOverError,
  TemporaryStorageCannotReceive
} from "../../errors";
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

  await acceptedInfoSchema.validate(acceptedInfo);

  const acceptedForm = await transitionForm(user, form, {
    type: EventType.MarkAsAccepted,
    formUpdateInput: acceptedInfo
  });

  return expandFormFromDb(acceptedForm);
};

export default markAsAcceptedResolver;
