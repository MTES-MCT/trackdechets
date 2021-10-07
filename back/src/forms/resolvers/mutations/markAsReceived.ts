import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { checkCanMarkAsReceived } from "../../permissions";
import { receivedInfoSchema } from "../../validation";
import { EventType } from "../../workflow/types";
import { expandFormFromDb } from "../../form-converter";
import { TemporaryStorageCannotReceive } from "../../errors";
import prisma from "../../../prisma";

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
    const temporaryStorageDetail = await prisma.form
      .findUnique({ where: { id: form.id } })
      .temporaryStorageDetail();

    if (!temporaryStorageDetail?.signedAt) {
      throw new TemporaryStorageCannotReceive();
    }
  }

  await receivedInfoSchema.validate(receivedInfo);
  const formUpdateInput = {
    ...receivedInfo,
    currentTransporterSiret: ""
  };
  const receivedForm = await transitionForm(user, form, {
    type: EventType.MarkAsReceived,
    formUpdateInput
  });

  // check for stale transport segments and delete them
  const transportSegments = await prisma.form
    .findUnique({ where: { id: form.id } })
    .transportSegments();
  if (transportSegments.length > 0) {
    const staleSegments = transportSegments
      .filter(f => !f.takenOverAt)
      .map(s => s.id);
    await prisma.transportSegment.deleteMany({
      where: { id: { in: staleSegments } }
    });
  }

  return expandFormFromDb(receivedForm);
};

export default markAsReceivedResolver;
