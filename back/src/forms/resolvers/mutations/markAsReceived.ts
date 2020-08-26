import {
  MutationResolvers,
  MutationMarkAsReceivedArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import transitionForm from "../../workflow/transitionForm";
import { checkCanMarkAsReceived } from "../../permissions";
import { validateReceivedInfos } from "../../validation";

function validateArgs({ id, receivedInfo }: MutationMarkAsReceivedArgs) {
  return { id, receivedInfo: validateReceivedInfos(receivedInfo) };
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
