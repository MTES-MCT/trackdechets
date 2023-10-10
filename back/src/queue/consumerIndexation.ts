import { indexBsdJob } from "./jobs";
import { indexQueue } from "./producers/elastic";
import { favoritesCompanyQueue } from "./producers/company";
import {
  DELETE_JOB_NAME,
  INDEX_JOB_NAME,
  INDEX_CREATED_JOB_NAME,
  INDEX_UPDATED_JOB_NAME
} from "./producers/jobNames";
import { deleteBsdJob } from "./jobs/deleteBsd";
import { indexFavoritesJob } from "./jobs/indexFavorites";
import { indexChunkBsdJob, indexAllInBulkJob } from "./jobs/indexAllBsds";

function startConsumers() {
  console.info(`Indexation queues consumers started`);

  indexQueue.process(
    "indexChunk",
    parseInt(process.env.BULK_INDEX_JOB_CONCURRENCY, 10) || 1,
    indexChunkBsdJob
  );
  indexQueue.process("indexAllInBulk", indexAllInBulkJob);
  indexQueue.process(INDEX_JOB_NAME, indexBsdJob);
  indexQueue.process(INDEX_CREATED_JOB_NAME, indexBsdJob);
  indexQueue.process(INDEX_UPDATED_JOB_NAME, indexBsdJob);
  indexQueue.process(DELETE_JOB_NAME, deleteBsdJob);
  favoritesCompanyQueue.process(indexFavoritesJob);
}

startConsumers();
