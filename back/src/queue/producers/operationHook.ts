import Queue from "bull";
const { REDIS_URL, NODE_ENV } = process.env;

import { OperationHookArgs } from "../jobs/operationHook";

// Updates queue, used by the notifier. Items are enqueued once indexation is done
export const operationHooksQueue = new Queue<OperationHookArgs>(
  `queue_operation_hook_${NODE_ENV}`,
  REDIS_URL!,
  {
    defaultJobOptions: {
      removeOnComplete: 10_000
    }
  }
);
