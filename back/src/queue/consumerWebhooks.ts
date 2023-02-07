import { sendHookJob } from "./jobs";
import { webhooksQueue, SEND_WEBHOOK_JOB_NAME } from "./producers/webhooks";

function startWebhooksConsumers() {
  console.info(`Webhook queue consumers started`);

  webhooksQueue.process(SEND_WEBHOOK_JOB_NAME, sendHookJob);
}

startWebhooksConsumers();
