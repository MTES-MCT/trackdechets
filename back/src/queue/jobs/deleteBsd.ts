import { Job } from "bull";
import { toBsdElastic as toBsdaElastic } from "../../bsda/elastic";
import { toBsdElastic as toBsdasriElastic } from "../../bsdasris/elastic";
import { toBsdElastic as toBsvhuElastic } from "../../bsvhu/elastic";
import { toBsdElastic as toBsffElastic } from "../../bsffs/elastic";

import { BsdElastic, deleteBsd } from "../../common/elastic";
import prisma from "../../prisma";

export async function deleteBsdJob(job: Job<string>): Promise<BsdElastic> {
  const bsdId = job.data;

  await deleteBsd({ id: bsdId });

  if (bsdId.startsWith("BSDA-")) {
    const bsda = await prisma.bsda.findUnique({
      where: { id: bsdId },
      include: { intermediaries: true }
    });

    return toBsdaElastic(bsda);
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await prisma.bsdasri.findUnique({ where: { id: bsdId } });

    return toBsdasriElastic(bsdasri);
  }

  if (bsdId.startsWith("VHU-")) {
    const bsvhu = await prisma.bsvhu.findUnique({ where: { id: bsdId } });

    return toBsvhuElastic(bsvhu);
  }

  if (bsdId.startsWith("FF-")) {
    const bsff = await prisma.bsff.findUnique({
      where: { id: bsdId },
      include: { packagings: true }
    });
    return toBsffElastic(bsff);
  }

  throw new Error("Indexing this type of BSD is not handled by this worker.");
}
