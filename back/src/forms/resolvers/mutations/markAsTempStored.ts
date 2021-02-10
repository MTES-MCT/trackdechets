import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import transitionForm from "../../workflow/transitionForm";
import { getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsTempStored } from "../../permissions";
import { tempStoredInfoSchema } from "../../validation";
import { EventType } from "../../workflow/types";
import { expandFormFromDb } from "../../form-converter";
import { DestinationCannotTempStore } from "../../errors";

const markAsTempStoredResolver: MutationResolvers["markAsTempStored"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const { id, tempStoredInfos } = args;
  const form = await getFormOrFormNotFound({ id });

  await checkCanMarkAsTempStored(user, form);

  if (form.recipientIsTempStorage !== true) {
    throw new DestinationCannotTempStore();
  }

  const tempStorageUpdateInput = {
    tempStorerQuantityType: tempStoredInfos.quantityType,
    tempStorerQuantityReceived: tempStoredInfos.quantityReceived,
    tempStorerWasteAcceptationStatus: tempStoredInfos.wasteAcceptationStatus,
    tempStorerWasteRefusalReason: tempStoredInfos.wasteRefusalReason,
    tempStorerReceivedAt: tempStoredInfos.receivedAt
      ? new Date(tempStoredInfos.receivedAt)
      : null,
    tempStorerReceivedBy: tempStoredInfos.receivedBy,
    tempStorerSignedAt: tempStoredInfos.signedAt
      ? new Date(tempStoredInfos.signedAt)
      : null
  };

  const tempStorageUpdateInputValidated = await tempStoredInfoSchema.validate(
    tempStorageUpdateInput
  );

  const formUpdateInput = {
    temporaryStorageDetail: {
      update: tempStorageUpdateInputValidated
    }
  };

  const tempStoredForm = await transitionForm(user, form, {
    type: EventType.MarkAsTempStored,
    formUpdateInput
  });

  return expandFormFromDb(tempStoredForm);
};

export default markAsTempStoredResolver;
