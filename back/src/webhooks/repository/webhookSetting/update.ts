import { WebhookSetting, Prisma } from "@td/prisma";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

import { webhookSettingEventTypes } from "./eventTypes";
import {
  delWebhookSetting,
  setWebhookSetting
} from "../../../common/redis/webhooksettings";
import { UserInputError } from "../../../common/errors";

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

    // First, check if another webhook has the same endpointUri
    if (data.endpointUri) {
      const existingWebhookSettingCount = await prisma.webhookSetting.count({
        where: {
          orgId: where.orgId,
          id: { not: where.id },
          endpointUri: data.endpointUri.toString()
        }
      });

      if (existingWebhookSettingCount) {
        throw new UserInputError(
          `Cet établissement a déjà un webhook avec l'endpoint "${data.endpointUri}"`
        );
      }
    }

    // Remove the webhook from Redis
    const webhookSetting = await prisma.webhookSetting.findFirstOrThrow({
      where: { id: where.id }
    });
    await delWebhookSetting(webhookSetting);

    // Update in DB
    const updatedWebhookSetting = await prisma.webhookSetting.update({
      where,
      data
    });

    // If activated, add back to Redis
    if (updatedWebhookSetting.activated) {
      await setWebhookSetting(updatedWebhookSetting);
    }

    await prisma.event.create({
      data: {
        streamId: updatedWebhookSetting.id,
        actor: user.id,
        type: webhookSettingEventTypes.updated,
        data: data as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    return updatedWebhookSetting;
  };
}
