import Queue, { Job, JobOptions } from "bull";
const { REDIS_URL, NODE_ENV } = process.env;
import { OperationHookJobArgs } from "../jobs/operationHook";
import { logger } from "@td/logger";

export const OPERATION_HOOK_QUEUE_NAME = `queue_operation_hook_${NODE_ENV}`;

// Updates queue, used by the notifier. Items are enqueued once indexation is done
export const operationHooksQueue = new Queue<OperationHookJobArgs>(
  OPERATION_HOOK_QUEUE_NAME,
  REDIS_URL!,
  {
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000
    }
  }
);

export function enqueueOperationHookJob(
  args: OperationHookJobArgs,
  options?: JobOptions
): Promise<Job<OperationHookJobArgs>> {
  logger.info(`Enqueuing operation hook for ${args.initialBsdId}`);
  return operationHooksQueue.add(args, options);
}
