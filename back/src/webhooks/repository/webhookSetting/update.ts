import { WebhookSetting, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

import { webhookSettingEventTypes } from "./eventTypes";
import {
  delWebhookSetting,
  setWebhookSetting
} from "../../../common/redis/webhooksettings";

export type UpdateWebhookSettingFn = (
  where: Prisma.WebhookSettingWhereUniqueInput,
  data: Prisma.XOR<
    Prisma.WebhookSettingUpdateInput,
    Prisma.WebhookSettingUncheckedUpdateInput
  >,
  logMetadata?: LogMetadata
) => Promise<WebhookSetting>;

export function buildUpdatWebhookSettings(
  deps: RepositoryFnDeps
): UpdateWebhookSettingFn {
  return async (where, data, logMetadata?) => {
    const { prisma, user } = deps;

    const webhookSetting = await prisma.webhookSetting.update({ where, data });
    await delWebhookSetting(webhookSetting);

    if (webhookSetting.activated) {
      await setWebhookSetting(webhookSetting);
    }
    await prisma.event.create({
      data: {
        streamId: webhookSetting.id,
        actor: user.id,
        type: webhookSettingEventTypes.updated,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return webhookSetting;
  };
}
