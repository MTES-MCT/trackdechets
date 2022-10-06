import { Job } from "bull";
import {
  findManyAndIndexBsds,
  FindManyAndIndexBsdsFnSignature,
  index
} from "../../common/elastic";
import { indexElasticSearch } from "../../scripts/bin/indexElasticSearch.helpers";

export async function indexAllBsdJob() {
  try {
    // will index all BSD without downtime, only if need because of a mapping change
    await indexElasticSearch({
      index,
      force: false,
      useQueue: true
    });
  } catch (error) {
    throw new Error(`Error in indexAllBsdJob : ${error}`);
  }
}

/**
 *  will index a chunk of BSD
 */
export async function indexChunkBsdJob(job: Job<string>) {
  try {
    const {
      bsdName,
      index,
      skip,
      total: count,
      take,
      since
    }: FindManyAndIndexBsdsFnSignature = JSON.parse(job.data);
    // will index a chunk of BSD
    await findManyAndIndexBsds({
      bsdName,
      index,
      skip,
      total: count,
      take,
      since
    });
  } catch (error) {
    throw new Error(`Error in indexChunkBsdJob : ${error}`);
  }
}
