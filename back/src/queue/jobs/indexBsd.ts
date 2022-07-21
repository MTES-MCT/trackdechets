import { Job } from "bull";
import { BsdElastic, indexBsd } from "../../common/elastic";

export function indexBsdJob(job: Job<BsdElastic>): Promise<unknown> {
  return indexBsd(job.data);
}
