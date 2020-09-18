import {
  MutationMarkAsTempStoredArgs,
  MutationResolvers,
  TempStoredFormInput
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { Form } from "../../../generated/prisma-client";
import { GraphQLContext } from "../../../types";
import transitionForm from "../../workflow/transitionForm";
import { getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsTempStored } from "../../permissions";
import { tempStoredInfoSchema } from "../../validation";

export async function markAsTempStoredFn(
  form: Form,
  { tempStoredInfos }: MutationMarkAsTempStoredArgs,
  context: GraphQLContext
) {
  function tempStorageUpdateInput(infos: TempStoredFormInput) {
    return {
      tempStorerQuantityType: infos.quantityType,
      tempStorerQuantityReceived: infos.quantityReceived,
      tempStorerWasteAcceptationStatus: infos.wasteAcceptationStatus,
      tempStorerWasteRefusalReason: infos.wasteRefusalReason,
      tempStorerReceivedAt: infos.receivedAt,
      tempStorerReceivedBy: infos.receivedBy,
      tempStorerSignedAt: infos.signedAt ?? new Date()
    };
  }

  await tempStoredInfoSchema.validate(tempStorageUpdateInput(tempStoredInfos));

  return transitionForm(
    form,
    { eventType: "MARK_TEMP_STORED", eventParams: tempStoredInfos },
    context,
    infos => ({
      temporaryStorageDetail: {
        update: tempStorageUpdateInput(infos)
      }
    })
  );
}

const markAsTempStoredResolver: MutationResolvers["markAsTempStored"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const { id, tempStoredInfos } = args;
  const form = await getFormOrFormNotFound({ id });

  // if (form.recipientIsTempStorage !== true) {
  //   throw new UserInputError(
  //     "Vous ne pouvez pas marquer ce bordereau comme entreposé provisoirement car " +
  //       "le destinataire n'est pas identifé comme installation d'entreposage provisoire " +
  //       "ou de reconditionnement"
  //   );
  // }

  await checkCanMarkAsTempStored(user, form);

  return markAsTempStoredFn(form, { id, tempStoredInfos }, context);
};

export default markAsTempStoredResolver;
