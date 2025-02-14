import { Job } from "bull";
import {
  FormForElasticInclude,
  toBsdElastic as toBsddElastic
} from "../../forms/elastic";
import {
  getBsdaForElastic,
  toBsdElastic as toBsdaElastic
} from "../../bsda/elastic";
import {
  BsdasriForElasticInclude,
  toBsdElastic as toBsdasriElastic
} from "../../bsdasris/elastic";
import {
  getBsvhuForElastic,
  toBsdElastic as toBsvhuElastic
} from "../../bsvhu/elastic";
import {
  BsffForElasticInclude,
  toBsdElastic as toBsffElastic
} from "../../bsffs/elastic";
import {
  BspaohForElasticInclude,
  toBsdElastic as toBspaohElastic
} from "../../bspaoh/elastic";

import { lookupUtils as bsdaLookupUtils } from "../../bsda/registryV2";
import { lookupUtils as bsdasriLookupUtils } from "../../bsdasris/registryV2";
import { lookupUtils as bsddLookupUtils } from "../../forms/registryV2";
import { lookupUtils as bsffLookupUtils } from "../../bsffs/registryV2";
import { lookupUtils as bspaohLookupUtils } from "../../bspaoh/registryV2";
import { lookupUtils as bsvhuLookupUtils } from "../../bsvhu/registryV2";

import { BsdElastic, deleteBsd } from "../../common/elastic";
import { prisma } from "@td/prisma";

export async function deleteBsdJob(job: Job<string>): Promise<BsdElastic> {
  const bsdId = job.data;

  await deleteBsd({ id: bsdId });

  if (bsdId.startsWith("BSDA-")) {
    const bsda = await getBsdaForElastic({ id: bsdId });
    await bsdaLookupUtils.delete(bsda.id);

    return toBsdaElastic(bsda);
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdId },
      include: BsdasriForElasticInclude
    });
    await bsdasriLookupUtils.delete(bsdasri.id);
    return toBsdasriElastic(bsdasri);
  }

  if (bsdId.startsWith("VHU-")) {
    const bsvhu = await getBsvhuForElastic({ id: bsdId });
    await bsvhuLookupUtils.delete(bsvhu.id);

    return toBsvhuElastic(bsvhu);
  }

  if (bsdId.startsWith("FF-")) {
    const bsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsdId },
      include: BsffForElasticInclude
    });
    await bsffLookupUtils.delete(bsff.id);

    return toBsffElastic(bsff);
  }

  if (bsdId.startsWith("PAOH-")) {
    const bspaoh = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bsdId },
      include: BspaohForElasticInclude
    });
    await bspaohLookupUtils.delete(bspaoh.id);
    return toBspaohElastic(bspaoh);
  }

  // For Bsdds the id is a random uuid.
  const bsdd = await prisma.form.findUniqueOrThrow({
    where: { id: bsdId },
    include: FormForElasticInclude
  });
  await bsddLookupUtils.delete(bsdd.id);
  return toBsddElastic(bsdd);
}
