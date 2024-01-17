import { bulkIndexQueue, indexChunkBsdJob } from "back";

function startConsumers() {
  console.info(`Bulk indexation queues consumers started`);

  bulkIndexQueue.process(
    "indexChunk",
    parseInt(process.env.BULK_INDEX_JOB_CONCURRENCY, 10) || 1,
    indexChunkBsdJob
  );
}

startConsumers();
