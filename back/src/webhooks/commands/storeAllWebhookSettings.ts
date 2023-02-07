import {
  setWebhookSetting,
  clearWebhookSetting
} from "../../common/redis/webhooksettings";
import prisma from "../../prisma";

/**
 * Clear exsting redis webhooks settings and store current webhookSettings in redis
 */
async function storeAllWebhookSettings() {
  // clear all webhooks
  await clearWebhookSetting();

  const webhookConfigs = await prisma.webhookSetting.findMany({
    where: { activated: true }
  });

  for (const whc of webhookConfigs) {
    await setWebhookSetting(whc);
  }
}

storeAllWebhookSettings()
  .then(() => {
    console.info("ok");
  })
  .catch(() => {
    console.error("ok");
  });
