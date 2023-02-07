import {
  MutationDeleteWebhookSettingArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getWebhookSettingRepository } from "../../repository";

import { formatWebhookSettingFromDB } from "../../converter";
import { getWebhookSettingOrNotFound } from "../../database";

import { checkCanEditWebhookSetting } from "../../permissions";
import {
  delWebhookSetting,
  setWebhookSettingsByOrgid
} from "../../../common/redis/webhooksettings";

const deleteWebhookSettingResolver = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationDeleteWebhookSettingArgs,
  context: GraphQLContext
) => {
  const { id } = args;
  const user = checkIsAuthenticated(context);

  const webhookSetting = await getWebhookSettingOrNotFound({ id });

  await checkCanEditWebhookSetting(user, webhookSetting);

  const webhookSettingRepository = getWebhookSettingRepository(user);

  const updatedWebhookSetting = await webhookSettingRepository.delete({
    id: id
  });

  await delWebhookSetting(webhookSetting);
  await setWebhookSettingsByOrgid(webhookSetting.orgId);

  return formatWebhookSettingFromDB(updatedWebhookSetting);
};

export default deleteWebhookSettingResolver;
