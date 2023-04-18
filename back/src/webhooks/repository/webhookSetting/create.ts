import { WebhookSetting, Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { webhookSettingEventTypes } from "./eventTypes";
import { setWebhookSetting } from "../../../common/redis/webhooksettings";

export type CreateWebhookSettingFn = (
  data: Prisma.WebhookSettingCreateInput,
  logMetadata?: LogMetadata
) => Promise<WebhookSetting>;

export function buildCreateWebhookSetting(
  deps: RepositoryFnDeps
): CreateWebhookSettingFn {
  return async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const webhookSetting = await prisma.webhookSetting.create({ data });

    await prisma.event.create({
      data: {
        streamId: webhookSetting.id,
        actor: user.id,
        type: webhookSettingEventTypes.created,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    if (webhookSetting.activated) {
      await setWebhookSetting(webhookSetting);
    }
    return webhookSetting;
  };
}
