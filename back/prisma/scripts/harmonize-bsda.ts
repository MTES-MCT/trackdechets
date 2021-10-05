import { BsdaType, Prisma } from ".prisma/client";
import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Harmonize bsda",
  "Harmonize bsda",
  true
)
export class HarmonizeBsda implements Updater {
  async run() {
    const bsdas = await prisma.bsda.findMany({
        include: { bsdas: true }
      });

      for (const bsda of bsdas) {
        if (!bsda.bsdas.length) continue;

        const data: Prisma.BsdaUpdateInput = {};

        if (bsda.type === BsdaType.RESHIPMENT) {
            data.forwarding = { connect: { id: bsda.bsdas[0].id } };
          }
          if (bsda.type === BsdaType.GATHERING) {
            data.grouping = {
              create: bsda.bsdas.map(previousBsda => ({
                previousId: previousBsda.id,
                weight: previousBsda.destinationReceptionWeight
              }))
            };
          }

        data.bsdas = {
            disconnect: bsda.bsdas.map(({id}) => ({
              id
            }))
          };

          await prisma.bsda.update({ where: { id: bsda.id }, data });
      }
  }
}