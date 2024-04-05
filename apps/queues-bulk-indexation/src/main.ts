import {
  SIRENIFY_JOB_NAME,
  bulkIndexQueue,
  indexChunkBsdJob,
  sirenifyBsdJob
} from "back";

// Ne pas dépasser 1 en prod avec plusieurs workers
const BULK_INDEX_JOB_CONCURRENCY = process.env.BULK_INDEX_JOB_CONCURRENCY;

function startConsumers() {
  console.info(`Bulk indexation queues consumers started`);

  bulkIndexQueue.process(
    "indexChunk",
    parseInt(BULK_INDEX_JOB_CONCURRENCY, 10) || 1,
    indexChunkBsdJob
  );

  // Plutôt que de créer un worker à part, on se sert du
  // worker d'indexation en masse lorsque l'on souhaite
  // faire un rattrapage des données SIRENE
  bulkIndexQueue.process(SIRENIFY_JOB_NAME, 5, sirenifyBsdJob);
}

startConsumers();
