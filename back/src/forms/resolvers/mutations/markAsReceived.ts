import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound, getTransporters } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { checkCanMarkAsReceived } from "../../permissions";
import { Transporter, receivedInfoSchema } from "../../validation";
import { EventType } from "../../workflow/types";
import { getAndExpandFormFromDb } from "../../converter";
import { TemporaryStorageCannotReceive } from "../../errors";

import { getFormRepository } from "../../repository";
import {
  EmitterType,
  Prisma,
  QuantityType,
  Status,
  WasteAcceptationStatus
} from "@prisma/client";
import { renderFormRefusedEmail } from "../../mail/renderFormRefusedEmail";
import { sendMail } from "../../../mailer/mailing";
import { runInTransaction } from "../../../common/repository/helper";

const isWasteRefused = form => {
  // Final destination
  if (form.forwardedIn && !!form.forwardedIn.sentAt) {
    return (
      form.forwardedIn.wasteAcceptationStatus &&
      (form.forwardedIn.wasteAcceptationStatus ===
        WasteAcceptationStatus.REFUSED ||
        form.forwardedIn.wasteAcceptationStatus ===
          WasteAcceptationStatus.PARTIALLY_REFUSED)
    );
  }
  // Temp storer
  else {
    return (
      form.wasteAcceptationStatus &&
      (form.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED ||
        form.wasteAcceptationStatus ===
          WasteAcceptationStatus.PARTIALLY_REFUSED)
    );
  }
};

const markAsReceivedResolver: MutationResolvers["markAsReceived"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const { id, receivedInfo } = args;
  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsReceived(user, form);

  let transporters: Transporter[] = [];

  if (form.recipientIsTempStorage === true) {
    // this form can be mark as received only if it has been
    // taken over by the transporter after temp storage
    const { forwardedIn } =
      (await getFormRepository(user).findFullFormById(form.id)) ?? {};

    if (!forwardedIn?.emittedAt) {
      throw new TemporaryStorageCannotReceive();
    }
    transporters = await getTransporters(forwardedIn);
  } else {
    transporters = await getTransporters(form);
  }

  await receivedInfoSchema.validate({
    ...receivedInfo,
    transporters
  });

  const formUpdateInput: Prisma.FormUpdateInput = form.forwardedInId
    ? {
        forwardedIn: {
          update: {
            status: [
              WasteAcceptationStatus.ACCEPTED,
              WasteAcceptationStatus.PARTIALLY_REFUSED
            ].includes(receivedInfo.wasteAcceptationStatus as any)
              ? Status.ACCEPTED
              : receivedInfo.wasteAcceptationStatus ==
                WasteAcceptationStatus.REFUSED
              ? Status.REFUSED
              : Status.RECEIVED,
            ...receivedInfo
          }
        },
        currentTransporterOrgId: ""
      }
    : {
        ...receivedInfo,
        quantityReceivedType: QuantityType.REAL,
        currentTransporterOrgId: ""
      };

  const groupedForms = await getFormRepository(user).findGroupedFormsById(
    form.id
  );

  const receivedForm = await runInTransaction(async transaction => {
    const {
      update,
      deleteStaleSegments,
      removeAppendix2,
      updateAppendix1Forms
    } = getFormRepository(user, transaction);

    const receivedForm = await update(
      { id: form.id, status: form.status },
      {
        status: transitionForm(form, {
          type: EventType.MarkAsReceived,
          formUpdateInput
        }),
        ...formUpdateInput
      }
    );

    // check for stale transport segments and delete them
    // quick fix https://trackdechets.zammad.com/#ticket/zoom/1696
    await deleteStaleSegments({ id: form.id });

    if (
      form.emitterType === EmitterType.APPENDIX2 &&
      receivedInfo.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED
    ) {
      await removeAppendix2(id);
    }

    if (form.emitterType === EmitterType.APPENDIX1) {
      await updateAppendix1Forms({
        container: receivedForm,
        grouped: groupedForms
      });
    }

    return receivedForm;
  });

  // If the waste has been refused by the temp storer or the final destination,
  // send an email
  if (isWasteRefused(receivedForm)) {
    const refusedEmail = await renderFormRefusedEmail(receivedForm);
    if (refusedEmail) {
      sendMail(refusedEmail);
    }
  }

  return getAndExpandFormFromDb(receivedForm.id);
};

export default markAsReceivedResolver;
