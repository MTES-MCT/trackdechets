import { sendMailJob, indexBsdJob } from "./jobs";
import { mailQueue } from "./producers/mail";
import { indexQueue } from "./producers/elastic";
import { deleteBsdJob } from "./jobs/deleteBsd";
import {
  geocodeCompanyQueue,
  setCompanyDepartementQueue
} from "./producers/company";
import { geocodeJob } from "./jobs/geocode";
import { setDepartementJob } from "./jobs/setDepartement";
import { indexAllBsdJob, indexChunkBsdJob } from "./jobs/indexAllBsds";

function startConsumers() {
  console.info(`Queues processors started`);

  mailQueue.process(sendMailJob);
  // this job needs more memory than the others depending on the batch size in env BULK_INDEX_BATCH_SIZE
  indexQueue.process("indexAll", indexAllBsdJob);
  indexQueue.process(
    "indexChunk",
    parseInt(process.env.INDEX_CHUNK_QUEUE_CONCURRENCEY, 10) || 5,
    indexChunkBsdJob
  );
  indexQueue.process("index", indexBsdJob);
  indexQueue.process("delete", deleteBsdJob);
  geocodeCompanyQueue.process(geocodeJob);
  setCompanyDepartementQueue.process(setDepartementJob);
}

startConsumers();
