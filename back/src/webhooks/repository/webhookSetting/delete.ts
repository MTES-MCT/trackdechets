import { WebhookSetting, Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { webhookSettingEventTypes } from "./eventTypes";
import { delWebhookSetting } from "../../../common/redis/webhooksettings";

export type DeleteWebhookSettingFn = (
  where: Prisma.WebhookSettingWhereUniqueInput,
  logMetadata?: LogMetadata
) => Promise<WebhookSetting>;

export function buildDeleteWebhookSetting(
  deps: RepositoryFnDeps
): DeleteWebhookSettingFn {
  return async (where, logMetadata) => {
    const { user, prisma } = deps;
    const deletedWebhookSetting = await prisma.webhookSetting.delete({
      where
    });

    await prisma.event.create({
      data: {
        streamId: deletedWebhookSetting.id,
        actor: user.id,
        type: webhookSettingEventTypes.deleted,
        data: {},
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    await delWebhookSetting(deletedWebhookSetting);

    return deletedWebhookSetting;
  };
}
