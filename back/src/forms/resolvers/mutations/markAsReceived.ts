import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { checkCanMarkAsReceived } from "../../permissions";
import { receivedInfoSchema } from "../../validation";
import { EventType } from "../../workflow/types";
import { expandFormFromDb } from "../../converter";
import { TemporaryStorageCannotReceive } from "../../errors";
import prisma from "../../../prisma";

import { getFormRepository } from "../../repository";
import {
  Prisma,
  QuantityType,
  Status,
  WasteAcceptationStatus
} from "@prisma/client";
import { renderFormRefusedEmail } from "../../mail/renderFormRefusedEmail";
import { sendMail } from "../../../mailer/mailing";
import { runInTransaction } from "../../../common/repository/helper";

const markAsReceivedResolver: MutationResolvers["markAsReceived"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const { id, receivedInfo } = args;
  const form = await getFormOrFormNotFound({ id });
  await checkCanMarkAsReceived(user, form);

  if (form.recipientIsTempStorage === true) {
    // this form can be mark as received only if it has been
    // taken over by the transporter after temp storage
    const { forwardedIn } = await getFormRepository(user).findFullFormById(
      form.id
    );

    if (!forwardedIn?.emittedAt) {
      throw new TemporaryStorageCannotReceive();
    }
  }

  await receivedInfoSchema.validate(receivedInfo);

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
        currentTransporterSiret: ""
      }
    : {
        ...receivedInfo,
        quantityReceivedType: QuantityType.REAL,
        currentTransporterSiret: ""
      };

  const receivedForm = await runInTransaction(async transaction => {
    const formRepository = getFormRepository(user, transaction);
    const receivedForm = await formRepository.update(
      { id: form.id },
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
    await formRepository.deleteStaleSegments({ id: form.id });

    if (
      receivedInfo.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED
    ) {
      await formRepository.removeAppendix2(id);
    }
    return receivedForm;
  });

  if (
    receivedForm.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED ||
    receivedForm.wasteAcceptationStatus ===
      WasteAcceptationStatus.PARTIALLY_REFUSED
  ) {
    const refusedEmail = await renderFormRefusedEmail(receivedForm);
    sendMail(refusedEmail);
  }

  return expandFormFromDb(receivedForm);
};

export default markAsReceivedResolver;
