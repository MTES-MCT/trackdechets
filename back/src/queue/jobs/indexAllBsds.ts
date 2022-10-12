import { Job } from "bull";
import { reindexAllBsdsInBulk } from "../../bsds/indexation/bulkIndexBsds";
import {
  BsdIndex,
  findManyAndIndexBsds,
  FindManyAndIndexBsdsFnSignature
} from "../../common/elastic";
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
    // will index all BSD without downtime, only if need because of a mapping change
    await reindexAllBsdsInBulk({
      index,
      force,
      useQueue: true
    });
    return null;
  } catch (error) {
    logger.error(`Error in indexAllInBulk.`, error);
    throw error;
  }
}
