import { User, WebhookSetting } from "@prisma/client";

import { getUserWebhookCompanyOrgIds } from "./database";

import { WebhookSettingForbidden } from "./errors";

export async function checkCanEditWebhookSetting(
  user: User,
  webhookSetting: WebhookSetting
) {
  const companyOrgIds = await getUserWebhookCompanyOrgIds({ userId: user.id });

  if (!companyOrgIds.includes(webhookSetting.orgId)) {
    throw new WebhookSettingForbidden(webhookSetting.id);
  }
}
