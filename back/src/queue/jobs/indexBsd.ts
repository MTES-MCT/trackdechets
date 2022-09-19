import { Job } from "bull";
import { toBsdElastic } from "../../bsda/elastic";
import { BsdElastic, indexBsd } from "../../common/elastic";
import prisma from "../../prisma";

export async function indexBsdJob(job: Job<string>): Promise<BsdElastic> {
  const bsdId = job.data;

  if (bsdId.startsWith("BSDA-")) {
    const bsda = await prisma.bsda.findUnique({
      where: { id: bsdId },
      include: {
        // required for dashboard queries
        forwardedIn: { select: { id: true } },
        groupedIn: { select: { id: true } }
      }
    });

    const elasticBsda = toBsdElastic(bsda);
    await indexBsd(elasticBsda);

    return elasticBsda;
  }

  throw new Error("Indexing this type of BSD is not handled by this worker.");
}
