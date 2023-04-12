import { Job } from "bull";
import { toBsdElastic as toBsdaElastic } from "../../bsda/elastic";
import { toBsdElastic as toBsdasriElastic } from "../../bsdasris/elastic";
import { toBsdElastic as toBsvhuElastic } from "../../bsvhu/elastic";
import { toBsdElastic as toBsffElastic } from "../../bsffs/elastic";
import { BsdElastic, indexBsd } from "../../common/elastic";
import { indexForm } from "../../forms/elastic";
import prisma from "../../prisma";

export async function indexBsdJob(job: Job<string>): Promise<BsdElastic> {
  const bsdId = job.data;

  if (bsdId.startsWith("BSDA-")) {
    const bsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsdId },
      include: {
        // required for dashboard queries
        forwardedIn: { select: { id: true } },
        groupedIn: { select: { id: true } },
        intermediaries: true
      }
    });

    const elasticBsda = toBsdaElastic(bsda);
    await indexBsd(elasticBsda);

    return elasticBsda;
  }
  if (bsdId.startsWith("BSD-") || bsdId.startsWith("TD-")) {
    const fullForm = await prisma.form.findUniqueOrThrow({
      where: { readableId: bsdId },
      include: {
        forwardedIn: true,
        transportSegments: true,
        intermediaries: true
      }
    });
    const elasticBsdd = await indexForm(fullForm);
    return elasticBsdd;
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

    return elasticBsdasri;
  }

  if (bsdId.startsWith("VHU-")) {
    const bsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsdId }
    });

    const elasticBsvhu = toBsvhuElastic(bsvhu);
    await indexBsd(elasticBsvhu);

    return elasticBsvhu;
  }

  if (bsdId.startsWith("FF-")) {
    const bsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsdId },
      include: { packagings: true, ficheInterventions: true }
    });

    const elasticBsff = toBsffElastic(bsff);
    await indexBsd(elasticBsff);

    return elasticBsff;
  }

  throw new Error("Indexing this type of BSD is not handled by this worker.");
}
