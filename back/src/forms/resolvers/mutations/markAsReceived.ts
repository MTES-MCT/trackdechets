import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { checkCanMarkAsReceived } from "../../permissions";
import { receivedInfoSchema } from "../../validation";
import { EventType } from "../../workflow/types";
import { expandFormFromDb } from "../../form-converter";
import prisma from "../../../prisma";
import { getFormRepository } from "../../repository";
import { WasteAcceptationStatus, Status, Prisma } from "@prisma/client";

const markAsReceivedResolver: MutationResolvers["markAsReceived"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const { id, receivedInfo } = args;
  const form = await getFormOrFormNotFound({ id });
  await checkCanMarkAsReceived(user, form);
  const formRepository = getFormRepository(user);

  await receivedInfoSchema.validate(receivedInfo);

  let formUpdateInput: Prisma.FormUpdateInput = {
    ...receivedInfo,
    currentTransporterSiret: ""
  };

  if (form.recipientIsTempStorage && form.status === Status.SENT) {
    // destination was initially identified as temporary storage
    // but the destination is receiving the BSDD as final destination
    // so we need to toggle off recipientIsTempStorage and delete
    // temporaryStorageDetail
    formUpdateInput = {
      ...formUpdateInput,
      recipientIsTempStorage: false,
      temporaryStorageDetail: {
        delete: true
      }
    };
  }

  const receivedForm = await transitionForm(user, form, {
    type: EventType.MarkAsReceived,
    formUpdateInput
  });

  // check for stale transport segments and delete them
  // quick fix https://trackdechets.zammad.com/#ticket/zoom/1696
  const staleSegments = await prisma.form
    .findUnique({ where: { id: form.id } })
    .transportSegments({ where: { takenOverAt: null } });
  if (staleSegments.length > 0) {
    await prisma.transportSegment.deleteMany({
      where: { id: { in: staleSegments.map(s => s.id) } }
    });
  }

  if (receivedInfo.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED) {
    await formRepository.removeAppendix2(id);
  }

  return expandFormFromDb(receivedForm);
};

export default markAsReceivedResolver;
