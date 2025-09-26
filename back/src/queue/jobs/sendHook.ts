import axios from "axios";
import {
  getWebhookSettings,
  handleWebhookFail
} from "../../common/redis/webhooksettings";
import { aesDecrypt } from "../../utils";
import { WebhookQueueItem } from "../producers/webhooks";
import { Job } from "bull";
import { logger } from "@td/logger";

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
  endpointUri,
  orgId,
  payload
}: {
  endpointUri: string;
  orgId: string;
  payload: { action: string; id: string; token: string };
}) => {
  const { action, id, token } = payload;
  logger.info(`Sending webhook request to ${endpointUri}`, { action });

  try {
    const clearToken = aesDecrypt(token);
    // we send the payload as an array, maybe we'll group webhooks by recipients in the future
    const res = await axiosPost(endpointUri, action, id, clearToken);
    // Customer server endpoint are supposed to return HTTP 200 each time a request is made
    if (res.status !== 200) {
      logger.warn(
        `Webhook invalid return status (${res.status}) (${endpointUri})`,
        { status: res.status }
      );
    }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      logger.error(`Webhook error : `, {
        endpointUri,
        action,
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        ...(!err.response ? { request: err.request } : {})
      });
    } else {
      logger.error(`Unexpected webhook error: ${err}`, {
        err,
        endpointUri,
        action
      });
    }

    await handleWebhookFail(orgId, endpointUri);
    // throw to trigger bull retry mechanism
    throw new WebhookRequestError(
      `Webhook request fail for orgId ${orgId} and endpoint ${endpointUri}`
    );
  }
};

export async function sendHookJob(job: Job<WebhookQueueItem>) {
  const { id, sirets, action } = job.data;

  const uniqueOrgIds = new Set(sirets);

  const errors: string[] = [];
  for (const orgId of uniqueOrgIds) {
    const settings = await getWebhookSettings(orgId);

    if (!settings.length) {
      continue;
    }

    for (const setting of settings) {
      try {
        await apiCallProcessor({
          endpointUri: setting.endpointUri,
          orgId,
          payload: {
            token: setting.token,
            id,
            action
          }
        });
      } catch (e) {
        // Let the loop continue. We'll throw later on
        errors.push(e.message);
      }
    }
  }

  // At least one webhook failed for this BSD. Try again
  if (errors.length) {
    throw new WebhookRequestError(
      `Webhook job threw errors (id=${id}, sirets=[${sirets}], action=${action}): ${errors.join(
        ", "
      )}`
    );
  }
}
