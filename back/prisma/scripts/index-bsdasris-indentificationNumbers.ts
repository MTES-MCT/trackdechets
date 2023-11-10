import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";
import { enqueueUpdatedBsdToIndex } from "../../src/queue/producers/elastic";

@registerUpdater(
  "Reindex BSDASRIs with identificationNumbers",
  "Reindex BSDASRIs with identificationNumbers",
  true
)
export class ReindexBsdasrisWithIdentificationNumbers implements Updater {
  async run() {
    // Fetch dasris with identification numbers
    const bsdasris = await prisma.bsdasri.findMany({
      where: { identificationNumbers: { isEmpty: false } },
      select: { id: true }
    });

    // Re-index
    for (const bsdasri of bsdasris) {
      // ~ 5000 bordereaux en prod
      // select count(*) from "default$default"."Bsdasri" where array_length("identificationNumbers", 1) > 0;
      enqueueUpdatedBsdToIndex(bsdasri.id);
    }
  }
}
