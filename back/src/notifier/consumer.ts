import { Job } from "bull";
import { BsdUpdateQueueItem, updatesQueue } from "../queue/producers/elastic";
import { pushWebHookUpdate } from "./handlers/web-hook";
import { pushSseUpdate } from "./handlers/sse";

export function startUpdatesConsumer() {
  updatesQueue.process(processUpdateEvent);
}

function processUpdateEvent(job: Job<BsdUpdateQueueItem>) {
  const { id, sirets } = job.data;

  const uniqueSirets = new Set(sirets);
  pushSseUpdate(uniqueSirets);
  pushWebHookUpdate(uniqueSirets, id);
}
