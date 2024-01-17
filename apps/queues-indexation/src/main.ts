import {
  indexBsdJob,
  indexQueue,
  favoritesCompanyQueue,
  DELETE_JOB_NAME,
  INDEX_JOB_NAME,
  INDEX_CREATED_JOB_NAME,
  INDEX_UPDATED_JOB_NAME,
  deleteBsdJob,
  indexFavoritesJob,
  indexAllInBulkJob
} from "back";

function startConsumers() {
  console.info(`Indexation queues consumers started`);
  indexQueue.process("indexAllInBulk", indexAllInBulkJob);
  indexQueue.process(INDEX_JOB_NAME, indexBsdJob);
  indexQueue.process(INDEX_CREATED_JOB_NAME, indexBsdJob);
  indexQueue.process(INDEX_UPDATED_JOB_NAME, indexBsdJob);
  indexQueue.process(DELETE_JOB_NAME, deleteBsdJob);
  favoritesCompanyQueue.process(indexFavoritesJob);
}

startConsumers();
