import { WebhookSetting } from "@td/codegen-back";
import { WebhookSetting as DbWebhookSetting } from "@prisma/client";

export function formatWebhookSettingFromDB(
  webhookSetting: DbWebhookSetting
): WebhookSetting {
  return {
    id: webhookSetting.id,
    activated: webhookSetting.activated,
    createdAt: webhookSetting.createdAt,
    endpointUri: webhookSetting.endpointUri,
    orgId: webhookSetting.orgId
  };
}
