import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import transitionForm from "../../workflow/transitionForm";
import { getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsTempStored } from "../../permissions";
import { tempStoredInfoSchema } from "../../validation";
import { EventType } from "../../workflow/types";
import { expandFormFromDb } from "../../form-converter";
import { Prisma, WasteAcceptationStatus } from "@prisma/client";
import { getFormRepository } from "../../repository";

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

  const tempStorageUpdateInput = {
    tempStorerQuantityType: tempStoredInfos.quantityType,
    tempStorerQuantityReceived: tempStoredInfos.quantityReceived,
    tempStorerWasteAcceptationStatus: tempStoredInfos.wasteAcceptationStatus,
    tempStorerWasteRefusalReason: tempStoredInfos.wasteRefusalReason,
    tempStorerReceivedAt: tempStoredInfos.receivedAt,
    tempStorerReceivedBy: tempStoredInfos.receivedBy,
    tempStorerSignedAt: tempStoredInfos.signedAt
  };

  await tempStoredInfoSchema.validate(tempStorageUpdateInput);

  const { temporaryStorageDetail } = await formRepository.findFullFormById(
    form.id
  );

  let formUpdateInput: Prisma.FormUpdateInput = {};

  if (temporaryStorageDetail) {
    formUpdateInput = {
      temporaryStorageDetail: { update: tempStorageUpdateInput }
    };
  } else {
    // temporary storage installation have been mistakenly identified as
    // final destination, set recipientIsTempStorage to true and create
    // temporaryStorageDetail
    formUpdateInput = {
      recipientIsTempStorage: true,
      temporaryStorageDetail: { create: tempStorageUpdateInput }
    };
  }

  const tempStoredForm = await transitionForm(user, form, {
    type: EventType.MarkAsTempStored,
    formUpdateInput
  });

  if (
    tempStoredInfos.wasteAcceptationStatus === WasteAcceptationStatus.REFUSED
  ) {
    await formRepository.removeAppendix2(id);
  }

  return expandFormFromDb(tempStoredForm);
};

export default markAsTempStoredResolver;
