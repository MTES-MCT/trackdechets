import axios from "axios";
import { getWebhookSettings } from "../../common/redis/webhooksettings";
import { aesDecrypt } from "../../utils";
import { WebhookQueueItem } from "../producers/webhooks";
import { Job } from "bull";
import logger from "../../logging/logger";

const WEBHOOK_REQUEST_TIMEMOUT = 5000;

export const axiosPost = async (url, action, id, clearToken) => {
  return axios.post(url, [{ action, id }], {
    timeout: WEBHOOK_REQUEST_TIMEMOUT,
    headers: { Authorization: `Bearer: ${clearToken}` }
  });
};

const apiCallProcessor = async ({
  url,
  payload
}: {
  url: string;
  payload: { action: string; id: string; token: string };
}) => {
  const { action, id, token } = payload;
  logger.info(`Sending webhook request to ${url}`);
  let success = false;
  try {
    const clearToken = aesDecrypt(token);
    // we send the payload as an array, maybe we'll group webhooks by recipients in the future
    const res = await axiosPost(url, action, id, clearToken);
    if (res.status !== 200) {
      logger.error(`Webhook invalid return status (${res.status}) (${url})`);
    } else {
      success = true;
    }
  } catch (err) {
    logger.error(`Webhook error : ${err.message} - ${err.code} (${url})`);
    if (err.response) {
      logger.error(
        `Webhook error - Status :${err.response.status} - Data: ${err.response.data} (${url})`
      );
    } else if (err.request) {
      logger.error(`Webhook error : ${err.request} (${url})`);
    } else {
      logger.error(`Webhook error : ${err.message} (${url})`);
    }
  }

  if (!success) {
    // todo: handle consecutive errors to deactivate webhooks
  }
};
export async function sendHookJob(job: Job<WebhookQueueItem>) {
  const { id, sirets, action } = job.data;

  const uniqueSirets = new Set(sirets);

  for (const siret of uniqueSirets) {
    const settings = await getWebhookSettings(siret);

    if (!settings.length) {
      continue;
    }
    for (const setting of settings) {
      await apiCallProcessor({
        url: setting.endpointUri,
        payload: {
          token: setting.token,
          id,
          action
        }
      });
    }
  }
}
