import prisma from "../../prisma";
import { BsdaForElasticInclude, indexBsda } from "../../bsda/elastic";
import { indexBsdasri } from "../../bsdasris/elastic";
import { indexBsff } from "../../bsffs/elastic";
import { indexBsvhu } from "../../bsvhu/elastic";
import { getFormForElastic, indexForm } from "../../forms/elastic";
import { deleteBsd } from "../../common/elastic";
import { getReadonlyBsdaRepository } from "../../bsda/repository";
import { getReadonlyBsvhuRepository } from "../../bsvhu/repository";
import { getReadonlyBsdasriRepository } from "../../bsdasris/repository";

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
        include: {
          grouping: { select: { id: true } },
          synthesizing: { select: { id: true } }
        }
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
      await indexBsff(bsff);
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
      await indexBsvhu(bsvhu);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return exitFn(true);
  }

  if (bsdId.startsWith("BSD-") || bsdId.startsWith("TD-")) {
    const formForElastic = await getFormForElastic({ readableId: bsdId });
    if (formForElastic.isDeleted) {
      await deleteBsd({ id: formForElastic.id });
    } else {
      await indexForm(formForElastic);
    }
    return exitFn(true);
  }
  return exitFn(false);
}
