import { Job } from "bull";
import {
  FormForElasticInclude,
  toBsdElastic as toBsddElastic
} from "../../forms/elastic";
import {
  BsdaForElasticInclude,
  toBsdElastic as toBsdaElastic
} from "../../bsda/elastic";
import {
  BsdasriForElasticInclude,
  toBsdElastic as toBsdasriElastic
} from "../../bsdasris/elastic";
import { toBsdElastic as toBsvhuElastic } from "../../bsvhu/elastic";
import {
  BsffForElasticInclude,
  toBsdElastic as toBsffElastic
} from "../../bsffs/elastic";
import {
  BspaohForElasticInclude,
  toBsdElastic as toBspaohElastic
} from "../../bspaoh/elastic";

import { BsdElastic, deleteBsd } from "../../common/elastic";
import { prisma } from "@td/prisma";

export async function deleteBsdJob(job: Job<string>): Promise<BsdElastic> {
  const bsdId = job.data;

  await deleteBsd({ id: bsdId });

  if (bsdId.startsWith("BSDA-")) {
    const bsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsdId },
      include: BsdaForElasticInclude
    });

    return toBsdaElastic(bsda);
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdId },
      include: BsdasriForElasticInclude
    });

    return toBsdasriElastic(bsdasri);
  }

  if (bsdId.startsWith("VHU-")) {
    const bsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsdId }
    });

    return toBsvhuElastic(bsvhu);
  }

  if (bsdId.startsWith("FF-")) {
    const bsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsdId },
      include: BsffForElasticInclude
    });
    return toBsffElastic(bsff);
  }

  if (bsdId.startsWith("PAOH-")) {
    const bspaoh = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bsdId },
      include: BspaohForElasticInclude
    });
    return toBspaohElastic(bspaoh);
  }

  // For Bsdds the id is a random uuid.
  const bsdd = await prisma.form.findUniqueOrThrow({
    where: { id: bsdId },
    include: FormForElasticInclude
  });
  if (bsdd) {
    return toBsddElastic(bsdd);
  }

  throw new Error("Indexing this type of BSD is not handled by this worker.");
}
