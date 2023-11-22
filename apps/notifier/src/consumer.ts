import { Job } from "bull";
import { BsdUpdateQueueItem, updatesQueue } from "back";

import { pushSseUpdate } from "./handlers/sse";

export function startUpdatesConsumer() {
  updatesQueue.process(processUpdateEvent);
}

function processUpdateEvent(job: Job<BsdUpdateQueueItem>) {
  const { sirets } = job.data;

  const uniqueSirets = new Set(sirets);
  pushSseUpdate(uniqueSirets);
}
