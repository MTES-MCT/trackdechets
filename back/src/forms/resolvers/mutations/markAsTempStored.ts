import {
  MutationMarkAsTempStoredArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { Form } from "../../../generated/prisma-client";
import { GraphQLContext } from "../../../types";
import transitionForm from "../../workflow/transitionForm";
import { getFormOrFormNotFound } from "../../database";
import { checkCanMarkAsTempStored } from "../../permissions";
import { UserInputError } from "apollo-server-express";
import { isValidDatetime } from "../../validation";
import { InvalidDateTime } from "../../../common/errors";

function validateArgs(args: MutationMarkAsTempStoredArgs) {
  const { tempStoredInfos } = args;

  if (!isValidDatetime(tempStoredInfos.receivedAt)) {
    throw new InvalidDateTime("receivedAt");
  }

  if (tempStoredInfos.signedAt && !isValidDatetime(tempStoredInfos.signedAt)) {
    throw new InvalidDateTime("signedAt");
  }

  if (tempStoredInfos.wasteAcceptationStatus === "REFUSED") {
    if (tempStoredInfos.quantityReceived !== 0) {
      throw new UserInputError(
        "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
      );
    }
  } else {
    // waste accepted or partially accepted
    if (tempStoredInfos.quantityReceived <= 0) {
      throw new UserInputError(
        "Vous devez saisir une quantité reçue supérieure à 0."
      );
    }
    if (
      tempStoredInfos.wasteAcceptationStatus === "ACCEPTED" &&
      tempStoredInfos.wasteRefusalReason
    ) {
      throw new UserInputError(
        "Le champ wasteRefusalReason ne doit pas être renseigné si le déchet est accepté "
      );
    }
  }

  return args;
}

export function markAsTempStoredFn(
  form: Form,
  { tempStoredInfos }: MutationMarkAsTempStoredArgs,
  context: GraphQLContext
) {
  return transitionForm(
    form,
    { eventType: "MARK_TEMP_STORED", eventParams: tempStoredInfos },
    context,
    infos => ({
      temporaryStorageDetail: {
        update: {
          tempStorerQuantityType: infos.quantityType,
          tempStorerQuantityReceived: infos.quantityReceived,
          tempStorerWasteAcceptationStatus: infos.wasteAcceptationStatus,
          tempStorerWasteRefusalReason: infos.wasteRefusalReason,
          tempStorerReceivedAt: infos.receivedAt,
          tempStorerReceivedBy: infos.receivedBy,
          tempStorerSignedAt: infos.signedAt ?? new Date()
        }
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
  const { id, tempStoredInfos } = validateArgs(args);
  const form = await getFormOrFormNotFound({ id });

  if (form.recipientIsTempStorage !== true) {
    throw new UserInputError(
      "Vous ne pouvez pas marquer ce bordereau comme entreposé provisoirement car " +
        "le destinataire n'est pas identifé comme installation d'entreposage provisoire " +
        "ou de reconditionnement"
    );
  }

  await checkCanMarkAsTempStored(user, form);

  return markAsTempStoredFn(form, { id, tempStoredInfos }, context);
};

export default markAsTempStoredResolver;
