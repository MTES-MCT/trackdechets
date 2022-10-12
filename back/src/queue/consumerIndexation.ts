import { indexBsdJob } from "./jobs";
import { indexQueue } from "./producers/elastic";
import { deleteBsdJob } from "./jobs/deleteBsd";
import { indexChunkBsdJob, indexAllInBulk } from "./jobs/indexAllBsds";

function startConsumers() {
  console.info(`Indexation queues consumers started`);

  indexQueue.process(
    "indexChunk",
    parseInt(process.env.BULK_INDEX_JOB_CONCURRENCY, 10) || 1,
    indexChunkBsdJob
  );
  indexQueue.process("indexAllInBulk", indexAllInBulk);
  indexQueue.process("index", indexBsdJob);
  indexQueue.process("delete", deleteBsdJob);
}

startConsumers();
