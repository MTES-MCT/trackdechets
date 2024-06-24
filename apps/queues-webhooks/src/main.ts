import { sendHookJob, webhooksQueue, SEND_WEBHOOK_JOB_NAME } from "back";

function startWebhooksConsumers() {
  console.info(`Webhook queue consumers started`);

  webhooksQueue.process(SEND_WEBHOOK_JOB_NAME, sendHookJob);
}

startWebhooksConsumers();
