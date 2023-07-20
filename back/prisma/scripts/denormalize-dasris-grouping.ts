import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Denormalize dasris",
  "Denormalize grouping dasris by caching grouped bsd emitters sirets",
  false
)
export class UpdateBsdasrisGroupedEmitters implements Updater {
  async run() {
    console.info("Denormalize dasris...");
    const groupedBsdasris = await prisma.bsdasri.findMany({
      where: { type: "GROUPING" },
      include: { grouping: true }
    });

    for (const bsd of groupedBsdasris) {
      if (!bsd.grouping?.length) {
        continue;
      }

      await prisma.bsdasri.update({
        where: { id: bsd.id },
        data: {
          groupingEmitterSirets: [
            ...new Set(bsd.grouping.map(grouped => grouped.emitterCompanySiret))
          ].filter(Boolean)
        }
      });
    }
    console.info("All done.");
  }
}
