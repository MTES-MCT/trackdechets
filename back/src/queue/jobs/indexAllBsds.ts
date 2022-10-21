import axios from "axios";
import { Job } from "bull";
import { BsdIndex } from "../../common/elastic";
import {
  findManyAndIndexBsds,
  FindManyAndIndexBsdsFnSignature,
  reindexAllBsdsInBulk
} from "../../bsds/indexation/bulkIndexBsds";
import logger from "../../logging/logger";

/**
 * Index one chunk of one given type of BSD
 */
export async function indexChunkBsdJob(job: Job<string>) {
  try {
    const {
      bsdName,
      index,
      skip,
      total,
      take,
      since
    }: FindManyAndIndexBsdsFnSignature = JSON.parse(job.data);
    logger.info(
      `Started job indexChunk for the following bsd and index names : "${bsdName}", "${index}"`
    );
    // will index a chunk of BSD
    await findManyAndIndexBsds({
      bsdName,
      index,
      skip,
      total,
      take,
      since
    });
    return null;
  } catch (error) {
    logger.error(`Error in indexChunkBsdJob.`, error);
    throw error;
  }
}

/**
 * Index all of BSD in other jobs
 */
export async function indexAllInBulk(job: Job<string>) {
  try {
    const { index, force }: { index: BsdIndex; force: boolean } = JSON.parse(
      job.data
    );
    const {
      SCALINGO_API_URL,
      SCALINGO_APP_NAME,
      SCALINGO_API_TOKEN,
      BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING,
      BULK_INDEX_SCALINGO_CONTAINER_NAME,
      BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP,
      BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN,
      BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP,
      BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN
    } = process.env;

    if (BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING === "true") {
      // scale-up indexqueue workers
      try {
        const resp = await axios({
          method: "post",
          url: `https://${SCALINGO_API_URL}/v1/apps/${SCALINGO_APP_NAME}/scale`,
          data: {
            containers: [
              {
                name: BULK_INDEX_SCALINGO_CONTAINER_NAME,
                amount:
                  parseInt(BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP, 10) || 4,
                size: BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP || "2XL"
              }
            ]
          },
          headers: {
            Authorization: `Bearer ${SCALINGO_API_TOKEN}`
          }
        });
        logger.info(
          `Scaled-up indexqueue workers to ${BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_UP} ${BULK_INDEX_SCALINGO_CONTAINER_SIZE_UP}`,
          resp.data
        );
      } catch (e) {
        logger.error(
          `Failed to scale-up indexqueue workers, please take a manual action instead`,
          e
        );
      }
    }

    // will index all BSD without downtime, only if need because of a mapping change
    await reindexAllBsdsInBulk({
      index,
      force,
      useQueue: true
    });
    if (BULK_INDEX_SCALINGO_ACTIVE_AUTOSCALING === "true") {
      // scale-down indexqueue workers
      try {
        const resp = await axios({
          method: "post",
          url: `https://${SCALINGO_API_URL}/v1/apps/${SCALINGO_APP_NAME}/scale`,
          data: {
            containers: [
              {
                name: BULK_INDEX_SCALINGO_CONTAINER_NAME,
                amount:
                  parseInt(BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN, 10) || 1,
                size: BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN || "M"
              }
            ]
          },
          headers: {
            Authorization: `Bearer ${SCALINGO_API_TOKEN}`
          }
        });
        logger.info(
          `Scaled-down indexqueue workers to ${BULK_INDEX_SCALINGO_CONTAINER_AMOUNT_DOWN} ${BULK_INDEX_SCALINGO_CONTAINER_SIZE_DOWN}`,
          resp.data
        );
      } catch (e) {
        logger.error(
          `Failed to scale-up indexqueue workers, please take a manual action instead`,
          e
        );
      }
    }
    return null;
  } catch (error) {
    logger.error(`Error in indexAllInBulk.`, error);
    throw error;
  }
}
