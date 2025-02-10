import { EmitterType, Status, WasteAcceptationStatus } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { getFormOrFormNotFound } from "../../database";
import { getAndExpandFormFromDb } from "../../converter";
import { checkCanMarkAsAccepted } from "../../permissions";
import { getFormRepository } from "../../repository";
import { acceptedInfoSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { renderFormRefusedEmail } from "../../mail/renderFormRefusedEmail";
import { sendMail } from "../../../mailer/mailing";
import { runInTransaction } from "../../../common/repository/helper";
import { isWasteRefused } from "./markAsReceived";

const markAsAcceptedResolver: MutationResolvers["markAsAccepted"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const { id, acceptedInfo } = args;
  const form = await getFormOrFormNotFound({ id }, { transporters: true });
  await checkCanMarkAsAccepted(user, form);

  await acceptedInfoSchema.validate({
    wasteDetailsPackagingInfos: form.wasteDetailsPackagingInfos,
    wasteDetailsIsDangerous: form.wasteDetailsIsDangerous,
    wasteDetailsPop: form.wasteDetailsPop,
    wasteDetailsCode: form.wasteDetailsCode,
    transporters: form.transporters,
    createdAt: form.createdAt,
    ...acceptedInfo
  });

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

  const groupedForms = await getFormRepository(user).findGroupedFormsById(
    form.id
  );

  const acceptedForm = await runInTransaction(async transaction => {
    const { update, updateAppendix1Forms, removeAppendix2 } = getFormRepository(
      user,
      transaction
    );

    const acceptedForm = await update(
      { id: form.id, status: form.status },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsAccepted,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    if (
      form.emitterType === EmitterType.APPENDIX2 &&
      acceptedInfo.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED
    ) {
      await removeAppendix2(id);
    }

    if (form.emitterType === EmitterType.APPENDIX1) {
      await updateAppendix1Forms({
        container: acceptedForm,
        grouped: groupedForms
      });
    }

    return acceptedForm;
  });

  if (isWasteRefused(acceptedForm)) {
    const refusedEmail = await renderFormRefusedEmail(acceptedForm);
    if (refusedEmail && refusedEmail.to?.length) {
      sendMail(refusedEmail);
    }
  }

  return getAndExpandFormFromDb(acceptedForm.id);
};

export default markAsAcceptedResolver;
