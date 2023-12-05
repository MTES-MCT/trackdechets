import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";
import { enqueueUpdatedBsdToIndex } from "../../src/queue/producers/elastic";

@registerUpdater(
  "Reindex BSDD with traders",
  "Reindex BSDD with traders",
  false
)
export class ReindexBsddWitTrader implements Updater {
  async run() {
    const bsds = await prisma.form.findMany({
      where: { traderCompanySiret: { not: null } },
      select: { readableId: true }
    });
    for (const bsd of bsds) {
      // ~ 150 000 bordereaux en prod
      enqueueUpdatedBsdToIndex(bsd.readableId);
    }
  }
}
