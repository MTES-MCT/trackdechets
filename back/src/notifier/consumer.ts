import { Job } from "bull";
import { BsdUpdateQueueItem, updatesQueue } from "../queue/producers/elastic";
import { pushHookUpdate } from "./hook";
import { pushSseUpdate } from "./sseHandler";

export function startUpdatesConsumer() {
  updatesQueue.process(processUpdateEvent);
}

function processUpdateEvent(job: Job<BsdUpdateQueueItem>) {
  const { id, sirets } = job.data;

  const uniqueSirets = new Set(sirets);
  pushSseUpdate(uniqueSirets);
  pushHookUpdate(uniqueSirets, id);
}
