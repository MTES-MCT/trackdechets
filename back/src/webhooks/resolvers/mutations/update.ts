import {
  MutationUpdateWebhookSettingArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getWebhookSettingRepository } from "../../repository";

import { formatWebhookSettingFromDB } from "../../converter";
import { getWebhookSettingOrNotFound } from "../../database";

import { validateWebhookUpdateInput } from "../../validation";
import { aesEncrypt } from "../../../utils";
import { checkCanEditWebhookSetting } from "../../permissions";

const updateWebhookSettingResolver = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationUpdateWebhookSettingArgs,
  context: GraphQLContext
) => {
  const { id, input } = args;
  const user = checkIsAuthenticated(context);

  const webhookSetting = await getWebhookSettingOrNotFound({ id });

  await checkCanEditWebhookSetting(user, webhookSetting);

  await validateWebhookUpdateInput(input);

  const { endpointUri, token, activated } = input;
  // exit if no change requested
  if (![endpointUri, token, activated].some(el => el !== undefined)) {
    return formatWebhookSettingFromDB(webhookSetting);
  }

  const webhookSettingRepository = getWebhookSettingRepository(user);

  const updatedWebhookSetting = await webhookSettingRepository.update(
    { id: id },
    {
      ...(endpointUri ? { endpointUri } : {}),
      ...(token ? { token: aesEncrypt(token) } : {}),
      ...(activated !== undefined ? { activated } : {})
    }
  );

  return formatWebhookSettingFromDB(updatedWebhookSetting);
};

export default updateWebhookSettingResolver;
