import Queue, { Job, JobOptions } from "bull";
const { REDIS_URL, NODE_ENV } = process.env;
import { logger } from "@td/logger";
import { UpdateAppendix2JobArgs } from "../jobs/updateAppendix2";

export const UPDATE_APPENDIX2_QUEUE_NAME = `queue_update_appendix2_${NODE_ENV}`;

export const updateAppendix2Queue = new Queue<UpdateAppendix2JobArgs>(
  UPDATE_APPENDIX2_QUEUE_NAME,
  REDIS_URL!,
  {
    defaultJobOptions: {
      removeOnComplete: 10_000
    }
  }
);

export function enqueueUpdateAppendix2Job(
  args: UpdateAppendix2JobArgs,
  options?: JobOptions
): Promise<Job<UpdateAppendix2JobArgs>> {
  logger.info(`Enqueuing update appendix2 job form ${args.formId}`);
  return updateAppendix2Queue.add(args, options);
}
