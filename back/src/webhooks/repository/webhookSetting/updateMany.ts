import { Prisma } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";

import { webhookSettingEventTypes } from "./eventTypes";

export type UpdateManyWebhookSettingFn = (
  where: Prisma.WebhookSettingWhereInput,
  data: Prisma.XOR<
    Prisma.WebhookSettingUpdateManyMutationInput,
    Prisma.WebhookSettingUncheckedUpdateManyInput
  >,
  logMetadata?: LogMetadata
) => Promise<Prisma.BatchPayload>;

export function buildUpdateManyWebhookSettings(
  deps: RepositoryFnDeps
): UpdateManyWebhookSettingFn {
  return async (where, data, logMetadata) => {
    const { prisma, user } = deps;

    const updated = await prisma.webhookSetting.updateMany({
      where,
      data
    });

    const updatedWebhookSettings = await prisma.webhookSetting.findMany({
      where,
      select: { id: true }
    });

    const ids = updatedWebhookSettings.map(({ id }) => id);

    const eventsData = ids.map(id => ({
      streamId: id,
      actor: user.id,
      type: webhookSettingEventTypes.updated,
      data: data as Prisma.InputJsonObject,
      metadata: { ...logMetadata, authType: user.auth }
    }));

    await prisma.event.createMany({
      data: eventsData
    });

    return updated;
  };
}
