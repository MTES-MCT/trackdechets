import { Job } from "bull";
import { toBsdElastic as toBsdaElastic } from "../../bsda/elastic";
import { toBsdElastic as toBsdasriElastic } from "../../bsdasris/elastic";
import { BsdElastic, deleteBsd } from "../../common/elastic";
import prisma from "../../prisma";

export async function deleteBsdJob(job: Job<string>): Promise<BsdElastic> {
  const bsdId = job.data;

  await deleteBsd({ id: bsdId });

  if (bsdId.startsWith("BSDA-")) {
    const bsda = await prisma.bsda.findUnique({ where: { id: bsdId } });

    return toBsdaElastic(bsda);
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await prisma.bsdasri.findUnique({ where: { id: bsdId } });

    return toBsdasriElastic(bsdasri);
  }
  throw new Error("Indexing this type of BSD is not handled by this worker.");
}
