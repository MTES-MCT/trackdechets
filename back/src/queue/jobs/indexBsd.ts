import { Job } from "bull";
import {
  getBsdaForElastic,
  toBsdElastic as toBsdaElastic
} from "../../bsda/elastic";
import { toBsdElastic as toBsdasriElastic } from "../../bsdasris/elastic";
import { toBsdElastic as toBsvhuElastic } from "../../bsvhu/elastic";
import { toBsdElastic as toBsffElastic } from "../../bsffs/elastic";
import { toBsdElastic as toBspaohElastic } from "../../bspaoh/elastic";
import { BsdElastic, indexBsd, getElasticBsdById } from "../../common/elastic";
import { getFormForElastic, indexForm } from "../../forms/elastic";
import prisma from "../../prisma";

export async function indexBsdJob(
  job: Job<string>
): Promise<BsdElastic & { siretsBeforeUpdate: string[] }> {
  const bsdId = job.data;
  const indexed = await getElasticBsdById(bsdId);

  // we keep track of previously indexed sirets in order to be able to notify a
  // company which would be removed from a bsd.
  // Next they're passed to the notify jobs (sse and webhooks)
  const siretsBeforeUpdate =
    indexed?.body?.hits?.hits?.[0]?._source?.sirets || [];
  if (bsdId.startsWith("BSDA-")) {
    const bsda = await getBsdaForElastic({ id: bsdId });

    const elasticBsda = toBsdaElastic(bsda);
    await indexBsd(elasticBsda);

    return { ...elasticBsda, siretsBeforeUpdate };
  }
  if (bsdId.startsWith("BSD-") || bsdId.startsWith("TD-")) {
    const rawForm = await getFormForElastic({ readableId: bsdId });
    const elasticBsdd = await indexForm(rawForm);
    return { ...elasticBsdd, siretsBeforeUpdate };
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdId },
      include: {
        // required for dashboard queries
        grouping: { select: { id: true } },
        synthesizing: { select: { id: true } }
      }
    });

    const elasticBsdasri = toBsdasriElastic(bsdasri);
    await indexBsd(elasticBsdasri);

    return { ...elasticBsdasri, siretsBeforeUpdate };
  }

  if (bsdId.startsWith("VHU-")) {
    const bsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsdId }
    });

    const elasticBsvhu = toBsvhuElastic(bsvhu);
    await indexBsd(elasticBsvhu);

    return { ...elasticBsvhu, siretsBeforeUpdate };
  }

  if (bsdId.startsWith("FF-")) {
    const bsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsdId },
      include: { packagings: true, ficheInterventions: true }
    });

    const elasticBsff = toBsffElastic(bsff);
    await indexBsd(elasticBsff);

    return { ...elasticBsff, siretsBeforeUpdate };
  }

  if (bsdId.startsWith("PAOH-")) {
    const bspaoh = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bsdId },
      include: { transporters: true }
    });

    const elasticBspaoh = toBspaohElastic(bspaoh);

    await indexBsd(elasticBspaoh);

    return { ...elasticBspaoh, siretsBeforeUpdate };
  }

  throw new Error("Indexing this type of BSD is not handled by this worker.");
}
