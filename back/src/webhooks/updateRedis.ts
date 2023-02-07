import { getReadonlyWebhookSettingRepository } from "./repository";
import { setWebhookSetting } from "../common/redis/webhooksettings";
//todo: remove
export async function udpateRedis() {
  const webhookConfigRepository = getReadonlyWebhookSettingRepository();
  const webhookConfigs = await webhookConfigRepository.findMany({});

  for (const whc of webhookConfigs) {
    await setWebhookSetting(whc);
  }
}
