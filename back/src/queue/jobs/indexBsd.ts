import { Job } from "bull";
import { toBsdElastic as toBsdaElastic } from "../../bsda/elastic";
import { toBsdElastic as toBsdasriElastic } from "../../bsdasris/elastic";
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

    const elasticBsda = toBsdaElastic(bsda);
    await indexBsd(elasticBsda);

    return elasticBsda;
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await prisma.bsdasri.findUnique({
      where: { id: bsdId },
      include: {
        // required for dashboard queries
        grouping: { select: { id: true } },
        synthesizing: { select: { id: true } }
      }
    });

    const elasticBsdasri = toBsdasriElastic(bsdasri);
    await indexBsd(elasticBsdasri);

    return elasticBsdasri;
  }
  throw new Error("Indexing this type of BSD is not handled by this worker.");
}
