import {
  MutationResolvers,
  MutationMarkAsReceivedArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { checkCanMarkAsReceived } from "../../permissions";
import { isValidDatetime } from "../../validation";
import { InvalidDateTime } from "../../../common/errors";
import { UserInputError } from "apollo-server-express";

function validateArgs(args: MutationMarkAsReceivedArgs) {
  const { receivedInfo } = args;

  if (!isValidDatetime(receivedInfo.receivedAt)) {
    throw new InvalidDateTime("receivedAt");
  }

  if (receivedInfo.signedAt && !isValidDatetime(receivedInfo.signedAt)) {
    throw new InvalidDateTime("signedAt");
  }

  if (receivedInfo.wasteAcceptationStatus === "REFUSED") {
    if (receivedInfo.quantityReceived !== 0) {
      throw new UserInputError(
        "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
      );
    }
  } else {
    // waste accepted or partially accepted
    if (receivedInfo.quantityReceived <= 0) {
      throw new UserInputError(
        "Vous devez saisir une quantité reçue supérieure à 0."
      );
    }
    if (
      receivedInfo.wasteAcceptationStatus === "ACCEPTED" &&
      receivedInfo.wasteRefusalReason
    ) {
      throw new UserInputError(
        "Le champ wasteRefusalReason ne doit pas être renseigné si le déchet est accepté "
      );
    }
  }

  return args;
}

const markAsReceivedResolver: MutationResolvers["markAsReceived"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const { id, receivedInfo } = validateArgs(args);
  const form = await getFormOrFormNotFound({ id });
  await checkCanMarkAsReceived(user, form);
  return transitionForm(
    form,
    {
      eventType: "MARK_RECEIVED",
      eventParams: { signedAt: new Date(), ...receivedInfo }
    },
    context,
    infos => ({ ...infos, currentTransporterSiret: "" })
  );
};

export default markAsReceivedResolver;
