import { bulkIndexQueue, indexChunkBsdJob } from "back";

// Ne pas dépasser 1 en prod avec plusieurs workers
const BULK_INDEX_JOB_CONCURRENCY = process.env.BULK_INDEX_JOB_CONCURRENCY;

function startConsumers() {
  console.info(`Bulk indexation queues consumers started`);

  bulkIndexQueue.process(
    "indexChunk",
    parseInt(BULK_INDEX_JOB_CONCURRENCY, 10) || 1,
    indexChunkBsdJob
  );
}

startConsumers();
