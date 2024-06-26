import { closeCompanyQueues } from "./company";
import { closeIndexAndUpdatesQueue } from "./elastic";
import { closeSyncEventsQueue } from "./events";
import { closeMailQueue } from "./mail";
import { closeWebhooksQueue } from "./webhooks";
import { closeGericoQueue } from "./gerico";

export function closeQueues() {
  return Promise.all([
    closeIndexAndUpdatesQueue(),
    closeMailQueue(),
    closeCompanyQueues(),
    closeSyncEventsQueue(),
    closeWebhooksQueue(),
    closeGericoQueue()
  ]);
}
