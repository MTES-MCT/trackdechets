import { BsdaType, Prisma } from ".prisma/client";
import { Bsda } from "@prisma/client";
import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater("Harmonize bsda", "Harmonize bsda", true)
export class HarmonizeBsda implements Updater {
  async run() {
    const bsdas = await prisma.bsda.findMany({
      include: { bsdas: true },
    });

    for (const bsda of bsdas) {
      const data: Prisma.BsdaUpdateInput = {};

      setAssociations(bsda, data);
      data.weightIsEstimate = bsda.quantityType === "REAL";

      await prisma.bsda.update({ where: { id: bsda.id }, data });
    }
  }
}

function setAssociations(
  bsda: Bsda & {
    bsdas: Bsda[];
  },
  data: Prisma.BsdaUpdateInput
) {
  if (!bsda.bsdas.length) return data;

  if (bsda.type === BsdaType.RESHIPMENT) {
    data.forwarding = { connect: { id: bsda.bsdas[0].id } };
  }
  if (bsda.type === BsdaType.GATHERING) {
    data.grouping = {
      connect: bsda.bsdas.map(({ id }) => ({ id })),
    };
  }

  data.bsdas = {
    disconnect: bsda.bsdas.map(({ id }) => ({
      id,
    })),
  };

  return data;
}
