import prisma from "../../prisma";
import { indexBsda } from "../../bsda/elastic";
import { indexBsdasri } from "../../bsdasris/elastic";
import { indexBsff } from "../../bsffs/elastic";
import { indexBsvhu } from "../../bsvhu/elastic";
import { indexForm } from "../../forms/elastic";
import { getFullForm } from "../../forms/database";
import { deleteBsd } from "../../common/elastic";
import { getReadonlyBsdaRepository } from "../../bsda/repository";

export async function reindex(bsdId, exitFn) {
  if (bsdId.startsWith("BSDA-")) {
    const bsda = await getReadonlyBsdaRepository().findUnique(
      { id: bsdId },
      {
        include: {
          forwardedIn: { select: { id: true } },
          groupedIn: { select: { id: true } }
        }
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
    const bsdasri = await prisma.bsdasri.findFirst({
      where: { id: bsdId, isDeleted: false },
      include: {
        grouping: { select: { id: true } },
        synthesizing: { select: { id: true } }
      }
    });

    if (!!bsdasri) {
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
    const bsvhu = await prisma.bsvhu.findFirst({
      where: { id: bsdId, isDeleted: false }
    });

    if (!!bsvhu) {
      await indexBsvhu(bsvhu);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return exitFn(true);
  }

  if (bsdId.startsWith("BSD-") || bsdId.startsWith("TD-")) {
    const bsdd = await prisma.form.findFirst({
      where: { readableId: bsdId, isDeleted: false }
    });
    if (!!bsdd) {
      const fullBsdd = await getFullForm(bsdd);
      await indexForm(fullBsdd);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return exitFn(true);
  }
  return exitFn(false);
}
