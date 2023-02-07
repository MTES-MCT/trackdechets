import { User, WebhookSetting } from "@prisma/client";

import { getUserWebhookCompanyIds } from "./database";

import { WebhookSettingForbidden } from "./errors";

export async function checkCanEditWebhookSetting(
  user: User,
  webhookSetting: WebhookSetting
) {
  const companyIds = await getUserWebhookCompanyIds({ userId: user.id });

  if (!companyIds.includes(webhookSetting.companyId)) {
    throw new WebhookSettingForbidden(webhookSetting.id);
  }
}
