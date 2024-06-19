import {
  sendHookJob,
  webhooksQueue,
  SEND_GERICO_API_REQUEST_JOB_NAME
} from "back";

function startWebhooksConsumers() {
  console.info(`Webhook queue consumers started`);

  webhooksQueue.process(SEND_GERICO_API_REQUEST_JOB_NAME, sendHookJob);
}

startWebhooksConsumers();
