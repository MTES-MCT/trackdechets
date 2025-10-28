import Queue, { Job, JobOptions } from "bull";
import { AdministrativeTransferArgs } from "../jobs/administrativeTransfer";
import { logger } from "@td/logger";

const { REDIS_URL, NODE_ENV } = process.env;

const ADMINISTRATIVE_TRANSFER_QUEUE_NAME = `queue_administrative_transfer_${NODE_ENV}`;

export const administrativeTransferQueue =
  new Queue<AdministrativeTransferArgs>(
    ADMINISTRATIVE_TRANSFER_QUEUE_NAME,
    REDIS_URL!,
    {
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500
      }
    }
  );

export function enqueueProcessAdministrativeTransferJob(
  args: AdministrativeTransferArgs,
  options?: JobOptions
): Promise<Job<AdministrativeTransferArgs>> {
  logger.info(
    `Enqueuing administrative transfer from org "${args.fromOrgId}" to org "${args.toOrgId}"`
  );
  return administrativeTransferQueue.add(args, options);
}
