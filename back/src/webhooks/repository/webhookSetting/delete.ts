import { WebhookSetting, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { webhookSettingEventTypes } from "./eventTypes";

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
    // todo: clear redis

    return deletedWebhookSetting;
  };
}
