// eslint-disable-next-line import/no-named-as-default
import Queue from "bull";
import { indexQueue } from "./elastic";

export type BsdUpdateQueueItem = { sirets: string[]; id: string };
const { REDIS_URL, NODE_ENV } = process.env;

// Events sync queue. Items are enqueued once indexation is done
export const syncEventsQueue = new Queue<void>(
  `queue_sync_events_${NODE_ENV}`,
  REDIS_URL,
  {
    defaultJobOptions: {
      removeOnComplete: 100
    }
  }
);

indexQueue.on("completed", () => {
  syncEventsQueue.add();
});

export function closeSyncEventsQueue() {
  return syncEventsQueue.close();
}
