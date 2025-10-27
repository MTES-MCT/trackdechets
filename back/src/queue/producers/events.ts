import Queue from "bull";
import { indexQueue } from "./elastic";

export type BsdUpdateQueueItem = { sirets: string[]; id: string };
const { REDIS_URL, NODE_ENV } = process.env;

// Events sync queue. Items are enqueued once indexation is done
export const syncEventsQueue = new Queue<void>(
  `queue_sync_events_${NODE_ENV}`,
  REDIS_URL!,
  {
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000
    }
  }
);

indexQueue.on("global:completed", async () => {
  // Every time events are created in Psql an index event is queued.
  // So we use the indexQueue as a trigger to launch a sync.
  // We dont sync id by id but in batch, hence there is no need to request a sync too often.
  // One awaiting request at a time should be sufficient.
  // And if a sync misses on a few events, the next one will catch up.
  const waitingCount = await syncEventsQueue.getWaitingCount();
  if (waitingCount === 0) {
    syncEventsQueue.add();
  }
});

export function closeSyncEventsQueue() {
  return syncEventsQueue.close();
}
