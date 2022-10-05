import { Status, WasteAcceptationStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../converter";
import { checkCanMarkAsAccepted } from "../../permissions";
import { getFormRepository } from "../../repository";
import { acceptedInfoSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { renderFormRefusedEmail } from "../../mail/renderFormRefusedEmail";
import { sendMail } from "../../../mailer/mailing";
import { runInTransaction } from "../../../common/repository/helper";

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

  const acceptedForm = await runInTransaction(async transaction => {
    const { update, removeAppendix2 } = getFormRepository(user, transaction);
    const acceptedForm = await update(
      { id: form.id },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsAccepted,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    if (
      acceptedInfo.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED
    ) {
      await removeAppendix2(id);
    }

    return acceptedForm;
  });

  if (
    acceptedForm.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED ||
    acceptedForm.wasteAcceptationStatus ===
      WasteAcceptationStatus.PARTIALLY_REFUSED
  ) {
    const refusedEmail = await renderFormRefusedEmail(acceptedForm);
    sendMail(refusedEmail);
  }

  return expandFormFromDb(acceptedForm);
};

export default markAsAcceptedResolver;
