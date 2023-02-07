import { redisClient } from "./redis";
import { WebhookSetting } from "@prisma/client";
import { getCompanyWebhookSettingsByOrgId } from "../../webhooks/helpers";

type WebhookInfo = { endpointUri: string; token: string };

export const WEBHOOK_SETTING_CACHE_KEY = "webhooks_setting";
const separator = "|";

export const genWebhookKey = (orgId: string): string =>
  `${WEBHOOK_SETTING_CACHE_KEY}:${orgId}`;

export async function getWebhookSettings(
  orgId: string
): Promise<WebhookInfo[]> {
  const key = genWebhookKey(orgId);
  const exists = await redisClient.exists(key);
  if (!exists) {
    return [];
  }
  const storedWebhooks = await redisClient.smembers(key);
  return storedWebhooks
    .map(el => el.split(separator))
    .map(el => ({ endpointUri: el[0], token: el[1] }));
}

export async function setWebhookSettingsByOrgid(orgId: string): Promise<void> {
  const key = genWebhookKey(orgId);
  const webhookSettings = await getCompanyWebhookSettingsByOrgId({ orgId });

  const redisSet = webhookSettings.map(
    wh => `${wh.endpointUri}${separator}${wh.token}`
  );

  await redisClient.pipeline().sadd(key, redisSet).exec();
}

export async function setWebhookSetting(
  webhookSetting: WebhookSetting
): Promise<void> {
  const key = genWebhookKey(webhookSetting.orgId);

  await redisClient.sadd(
    key,
    `${webhookSetting.endpointUri}${separator}${webhookSetting.token}`
  );
}

/**Delete all redis webhooks settings */
export async function clearWebhookSetting(cursor = 0): Promise<void> {
  const res = await redisClient.scan(
    cursor,
    "MATCH",
    `${WEBHOOK_SETTING_CACHE_KEY}*`
  );

  const keys = res[1];
  for (const key of keys) {
    await redisClient.del(key);
  }

  const resCursor = parseInt(res[0], 10);
  if (resCursor) {
    return clearWebhookSetting(resCursor);
  }
}

export async function delWebhookSetting(
  webhookSetting: WebhookSetting
): Promise<void> {
  const key = genWebhookKey(webhookSetting.orgId);
  await redisClient.del(key);
}
