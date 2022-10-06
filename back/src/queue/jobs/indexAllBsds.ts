import { Job } from "bull";
import {
  findManyAndIndexBsds,
  FindManyAndIndexBsdsFnSignature
} from "../../common/elastic";
import logger from "../../logging/logger";

/**
 * Index one chunk of one type of BSD
 */
export async function indexChunkBsdJob(job: Job<string>) {
  try {
    const {
      bsdName,
      index,
      skip,
      count,
      take,
      since
    }: FindManyAndIndexBsdsFnSignature = JSON.parse(job.data);
    // will index a chunk of BSD
    await findManyAndIndexBsds({
      bsdName,
      index,
      skip,
      count,
      take,
      since
    });
  } catch (error) {
    logger.error(`Error in indexChunkBsdJob : ${error}`, error);
    throw error;
  }
}
