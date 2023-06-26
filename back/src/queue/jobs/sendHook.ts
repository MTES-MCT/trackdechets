import axios from "axios";
import {
  getWebhookSettings,
  handleWebhookFail
} from "../../common/redis/webhooksettings";
import { aesDecrypt } from "../../utils";
import { WebhookQueueItem } from "../producers/webhooks";
import { Job } from "bull";
import logger from "../../logging/logger";

class WebhookRequestError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "WebhookRequestError";
  }
}

const WEBHOOK_REQUEST_TIMEMOUT = 5000;

export const axiosPost = async (url, action, id, clearToken) => {
  return axios.post(url, [{ action, id }], {
    timeout: WEBHOOK_REQUEST_TIMEMOUT,
    headers: { Authorization: `Bearer: ${clearToken}` }
  });
};

const apiCallProcessor = async ({
  url,
  orgId,
  payload
}: {
  url: string;
  orgId: string;
  payload: { action: string; id: string; token: string };
}) => {
  const { action, id, token } = payload;
  logger.info(`Sending webhook request to ${url}`);

  try {
    const clearToken = aesDecrypt(token);
    // we send the payload as an array, maybe we'll group webhooks by recipients in the future
    const res = await axiosPost(url, action, id, clearToken);
    // Customer server endpoint are supposed to return HTTP 200 each time a request si amde
    if (res.status !== 200) {
      // valid enpoint response, exit
      logger.error(`Webhook invalid return status (${res.status}) (${url})`);
    } else {
      return;
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

  await handleWebhookFail(orgId);
  // throw to trigger bull retry mechanism
  throw new WebhookRequestError(`Webhook requets fail for orgId ${orgId}`);
};
export async function sendHookJob(job: Job<WebhookQueueItem>) {
  const { id, sirets, action } = job.data;

  const uniqueOrgIds = new Set(sirets);

  for (const orgId of uniqueOrgIds) {
    const settings = await getWebhookSettings(orgId);

    if (!settings.length) {
      continue;
    }
    for (const setting of settings) {
      await apiCallProcessor({
        url: setting.endpointUri,
        orgId,
        payload: {
          token: setting.token,
          id,
          action
        }
      });
    }
  }
}
