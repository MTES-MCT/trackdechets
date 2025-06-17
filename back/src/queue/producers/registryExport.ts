import { logger } from "@td/logger";
import Queue, { Job, JobOptions } from "bull";
import { type RegistryExportJobArgs } from "../jobs/processRegistryExport";

const { REDIS_URL, NODE_ENV } = process.env;

export const REGISTRY_EXPORT_QUEUE_NAME = `queue_registry_export_${NODE_ENV}`;

export const registryExportQueue = new Queue<RegistryExportJobArgs>(
  REGISTRY_EXPORT_QUEUE_NAME,
  REDIS_URL!,
  {
    defaultJobOptions: {
      removeOnComplete: 10_000
    }
  }
);

export function enqueueRegistryExportJob(
  args: RegistryExportJobArgs,
  options?: JobOptions
): Promise<Job<RegistryExportJobArgs>> {
  logger.info(`Enqueuing registry export ${args.exportId}`);
  return registryExportQueue.add(args, options);
}
