import { Status, WasteAcceptationStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../form-converter";
import { checkCanMarkAsAccepted } from "../../permissions";
import { getFormRepository } from "../../repository";
import { acceptedInfoSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";

const markAsAcceptedResolver: MutationResolvers["markAsAccepted"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const formRepository = getFormRepository(user);
  const { id, acceptedInfo } = args;
  const form = await getFormOrFormNotFound({ id });
  await checkCanMarkAsAccepted(user, form);

  await acceptedInfoSchema.validate(acceptedInfo);

  const formUpdateInput = form.forwardedInId
    ? {
        forwardedIn: {
          update: {
            status:
              acceptedInfo.wasteAcceptationStatus === Status.REFUSED
                ? Status.REFUSED
                : Status.ACCEPTED,
            ...acceptedInfo,
            signedAt: new Date(acceptedInfo.signedAt)
          }
        }
      }
    : {
        ...acceptedInfo,
        signedAt: new Date(acceptedInfo.signedAt)
      };

  const acceptedForm = await formRepository.update(
    { id: form.id },
    {
      status: transitionForm(form, {
        type: EventType.MarkAsAccepted,
        formUpdateInput
      }),
      ...formUpdateInput
    }
  );

  if (acceptedInfo.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED) {
    await formRepository.removeAppendix2(id);
  }

  return expandFormFromDb(acceptedForm);
};

export default markAsAcceptedResolver;
