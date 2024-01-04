import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Denormalize dasris",
  "Denormalize synthesis dasris by caching child bsd emitter sirets",
  false
)
export class UpdateBsdasrisSyntesizedEmitters implements Updater {
  async run() {
    console.info("Denormalize dasris...");
    const synthesizedBsdasris = await prisma.bsdasri.findMany({
      where: { type: "SYNTHESIS" },
      include: { synthesizing: true }
    });

    for (const bsd of synthesizedBsdasris) {
      if (!bsd.synthesizing?.length) {
        continue;
      }

      await prisma.bsdasri.update({
        where: { id: bsd.id },
        data: {
          synthesisEmitterSirets: [
            ...new Set(
              bsd.synthesizing.map(associated => associated.emitterCompanySiret)
            )
          ].filter(Boolean) as string[]
        }
      });
    }
    console.info("All done.");
  }
}
