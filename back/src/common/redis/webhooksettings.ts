import { redisClient } from "./redis";
import { WebhookSetting } from "@prisma/client";
import { prisma } from "@td/prisma";

export type WebhookInfo = { endpointUri: string; token: string };

export const WEBHOOK_SETTING_CACHE_KEY = "webhooks_setting";
const WEBHOOK_FAIL_CACHE_KEY = "webhook_fail";
const separator = "|";

export const genWebhookKey = (orgId: string): string =>
  `${WEBHOOK_SETTING_CACHE_KEY}:${orgId}`;

/**
 * Retrieve all webhook settings for a given orgId
 */
export async function getWebhookSettings(
  orgId: string
): Promise<WebhookInfo[]> {
  const key = genWebhookKey(orgId);
  const storedWebhooks = await redisClient.smembers(key);

  return storedWebhooks
    .map(el => el.split(separator))
    .map(el => ({ endpointUri: el[0], token: el[1] }));
}

const smember = (webhookSetting: WebhookSetting) =>
  `${webhookSetting.endpointUri}${separator}${webhookSetting.token}`;

/**
 * Store a redis webhook setting - key : uri|token
 */
export async function setWebhookSetting(
  webhookSetting: WebhookSetting
): Promise<void> {
  const key = genWebhookKey(webhookSetting.orgId);
  await redisClient.sadd(key, smember(webhookSetting));
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
  await redisClient.srem(key, smember(webhookSetting));
}
// How many failed webhook for a given orgId before deactivation
const WEBHOOK_FAIL_ACCEPTED = parseInt(
  process.env.WEBHOOK_FAIL_ACCEPTED || "5",
  10
);
// How long after the last fail the counter is reset
const WEBHOOK_FAIL_RESET_DELAY = parseInt(
  process.env.WEBHOOK_FAIL_RESET_DELAY || "600",
  10
);

const genWebhookFailKey = (orgId: string, endpointUri: string): string =>
  `${WEBHOOK_FAIL_CACHE_KEY}:${orgId}:${endpointUri}`;

export async function handleWebhookFail(
  orgId: string,
  endpointUri: string
): Promise<void> {
  const key = genWebhookFailKey(orgId, endpointUri);
  const failCount = await redisClient.get(key);
  if (failCount && parseInt(failCount, 10) >= WEBHOOK_FAIL_ACCEPTED) {
    const wehbookSetting = await prisma.webhookSetting.findFirst({
      where: { endpointUri, orgId }
    });

    if (wehbookSetting) {
      await prisma.webhookSetting.update({
        where: { endpointUri, orgId },
        data: { activated: false }
      });
      await delWebhookSetting(wehbookSetting);
    }

    await redisClient.del(key);
    return;
  }

  await redisClient
    .pipeline()
    .incr(key)
    .expire(key, WEBHOOK_FAIL_RESET_DELAY)
    .exec();
}
