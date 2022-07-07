import { Job } from "bull";
import { BsdElastic, indexBsd } from "../../common/elastic";
import { initSentry } from "../../common/sentry";

const Sentry = initSentry();

export function indexBsdJob(job: Job<BsdElastic>): Promise<unknown> {
  try {
    return indexBsd(job.data);
  } catch (err) {
    Sentry.captureException(err);
  }
}
