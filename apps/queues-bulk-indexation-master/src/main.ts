import { bulkIndexMasterQueue, indexAllInBulkJob } from "back";

function startConsumers() {
  console.info(`Bulk indexation master queues consumers started`);
  bulkIndexMasterQueue.process("indexAllInBulk", indexAllInBulkJob);
}

startConsumers();
