import { logger } from "@td/logger";
import Queue, { Job, JobOptions } from "bull";
import { RegistryImportJobArgs } from "../jobs/processRegistryImport";

const { REDIS_URL, NODE_ENV } = process.env;

export const REGISTRY_IMPORT_QUEUE_NAME = `queue_registry_import_${NODE_ENV}`;

export const registryImportQueue = new Queue<RegistryImportJobArgs>(
  REGISTRY_IMPORT_QUEUE_NAME,
  REDIS_URL!,
  {
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000
    }
  }
);

export function enqueueRegistryImportToProcessJob(
  args: RegistryImportJobArgs,
  options?: JobOptions
): Promise<Job<RegistryImportJobArgs>> {
  logger.info(`Enqueuing registry import ${args.importId}`);
  return registryImportQueue.add(args, options);
}
