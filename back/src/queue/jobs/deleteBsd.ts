import { Job } from "bull";
import { toBsdElastic } from "../../bsda/elastic";
import { BsdElastic, deleteBsd } from "../../common/elastic";
import prisma from "../../prisma";

export async function deleteBsdJob(job: Job<string>): Promise<BsdElastic> {
  const bsdId = job.data;

  await deleteBsd({ id: bsdId });

  if (bsdId.startsWith("BSDA-")) {
    const bsda = await prisma.bsda.findUnique({ where: { id: bsdId } });

    return toBsdElastic(bsda);
  }

  throw new Error("Indexing this type of BSD is not handled by this worker.");
}
