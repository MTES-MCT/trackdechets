import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import transitionForm from "../../workflow/transitionForm";
import { getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsTempStored } from "../../permissions";
import { receivedInfoSchema } from "../../validation";
import { EventType } from "../../workflow/types";
import { expandFormFromDb } from "../../form-converter";
import { DestinationCannotTempStore } from "../../errors";
import { Prisma, WasteAcceptationStatus } from "@prisma/client";
import { getFormRepository } from "../../repository";
import prisma from "../../../prisma";

const markAsTempStoredResolver: MutationResolvers["markAsTempStored"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const formRepository = getFormRepository(user);
  const { id, tempStoredInfos } = args;
  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsTempStored(user, form);

  if (form.recipientIsTempStorage !== true) {
    throw new DestinationCannotTempStore();
  }

  await receivedInfoSchema.validate(tempStoredInfos);

  // TODO handle quantityType in case of temporary storage
  const { quantityType, ...tmpStoredInfos } = tempStoredInfos;

  const formUpdateInput: Prisma.FormUpdateInput = {
    ...tmpStoredInfos,
    currentTransporterSiret: ""
  };

  const tempStoredForm = await transitionForm(user, form, {
    type: EventType.MarkAsTempStored,
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

  if (
    tempStoredInfos.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED
  ) {
    await formRepository.removeAppendix2(id);
  }

  return expandFormFromDb(tempStoredForm);
};

export default markAsTempStoredResolver;
