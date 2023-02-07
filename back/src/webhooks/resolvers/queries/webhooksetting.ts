import { formatWebhookSettingFromDB } from "../../converter";

import { MissingId } from "../../errors";
import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getWebhookSettingOrNotFound } from "../../database";
import { checkCanEditWebhookSetting } from "../../permissions";

function validateArgs(args: any) {
  if (args.id == null) {
    throw new MissingId();
  }

  return args;
}

const webhookSettingResolver: QueryResolvers["webhooksetting"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const validArgs = validateArgs(args);

  const webhookSetting = await getWebhookSettingOrNotFound(validArgs);

  await checkCanEditWebhookSetting(user, webhookSetting);

  return formatWebhookSettingFromDB(webhookSetting);
};

export default webhookSettingResolver;
