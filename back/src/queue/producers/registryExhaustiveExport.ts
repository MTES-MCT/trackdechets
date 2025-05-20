import { logger } from "@td/logger";
import Queue, { Job, JobOptions } from "bull";
import { type RegistryExhaustiveExportJobArgs } from "../jobs/processRegistryExhaustiveExport";

const { REDIS_URL, NODE_ENV } = process.env;

export const REGISTRY_EXHAUSTIVE_EXPORT_QUEUE_NAME = `queue_registry_exhaustive_export_${NODE_ENV}`;

export const registryExhaustiveExportQueue =
  new Queue<RegistryExhaustiveExportJobArgs>(
    REGISTRY_EXHAUSTIVE_EXPORT_QUEUE_NAME,
    REDIS_URL!,
    {
      defaultJobOptions: {
        removeOnComplete: 10_000
      }
    }
  );

export function enqueueRegistryExhaustiveExportJob(
  args: RegistryExhaustiveExportJobArgs,
  options?: JobOptions
): Promise<Job<RegistryExhaustiveExportJobArgs>> {
  logger.info(`Enqueuing registry exhaustive export ${args.exportId}`);
  return registryExhaustiveExportQueue.add(args, options);
}
