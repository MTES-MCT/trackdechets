import { prisma } from "@td/prisma";
import { BsdaForElasticInclude, indexBsda } from "../../bsda/elastic";
import { BsdasriForElasticInclude, indexBsdasri } from "../../bsdasris/elastic";
import { getBsffForElastic, indexBsff } from "../../bsffs/elastic";
import { getBsvhuForElastic, indexBsvhu } from "../../bsvhu/elastic";
import { getBspaohForElastic, indexBspaoh } from "../../bspaoh/elastic";
import {
  getFormForElastic,
  indexForm,
  isBsddNotIndexable
} from "../../forms/elastic";
import { deleteBsd } from "../../common/elastic";
import { getReadonlyBsdaRepository } from "../../bsda/repository";
import { getReadonlyBsvhuRepository } from "../../bsvhu/repository";
import { getReadonlyBsdasriRepository } from "../../bsdasris/repository";
import { getReadonlyBspaohRepository } from "../../bspaoh/repository";

export async function reindex(bsdId, exitFn) {
  if (bsdId.startsWith("BSDA-")) {
    const bsda = await getReadonlyBsdaRepository().findUnique(
      { id: bsdId },
      {
        include: BsdaForElasticInclude
      }
    );
    if (!!bsda && !bsda.isDeleted) {
      await indexBsda(bsda);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return exitFn(true);
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await getReadonlyBsdasriRepository().findUnique(
      { id: bsdId },
      {
        include: BsdasriForElasticInclude
      }
    );

    if (!!bsdasri && !bsdasri.isDeleted) {
      await indexBsdasri(bsdasri);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return exitFn(true);
  }

  if (bsdId.startsWith("FF-")) {
    const bsff = await prisma.bsff.findFirst({
      where: { id: bsdId, isDeleted: false }
    });

    if (!!bsff) {
      await indexBsff(await getBsffForElastic(bsff));
    } else {
      await deleteBsd({ id: bsdId });
    }
    return exitFn(true);
  }

  if (bsdId.startsWith("VHU-")) {
    const bsvhu = await getReadonlyBsvhuRepository().findUnique({
      id: bsdId
    });

    if (!!bsvhu && !bsvhu.isDeleted) {
      await indexBsvhu(await getBsvhuForElastic(bsvhu));
    } else {
      await deleteBsd({ id: bsdId });
    }
    return exitFn(true);
  }

  if (bsdId.startsWith("PAOH-")) {
    const bspaoh = await getReadonlyBspaohRepository().findUnique({
      id: bsdId
    });

    if (!!bspaoh && !bspaoh.isDeleted) {
      await indexBspaoh(await getBspaohForElastic(bspaoh));
    } else {
      await deleteBsd({ id: bsdId });
    }
    return exitFn(true);
  }

  if (bsdId.startsWith("BSD-") || bsdId.startsWith("TD-")) {
    const formForElastic = await getFormForElastic({ readableId: bsdId });

    if (isBsddNotIndexable(formForElastic)) {
      await deleteBsd({ id: formForElastic.id });
    } else {
      await indexForm(formForElastic);
    }
    return exitFn(true);
  }
  return exitFn(false);
}
