import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "@td/prisma";
import { enqueueUpdatedBsdToIndex } from "../../src/queue/producers/elastic";

@registerUpdater(
  "Ré-indexe les BSDA présents dans un regroupement",
  "Ré-indexe les BSDA présents dans un regroupement",
  false
)
export class ReindexGroupedBsdas implements Updater {
  async run() {
    const bsdas = await prisma.bsda.findMany({
      // On souhaite réindexer les BSDAs inclut dans un regroupement
      // car il y avait une erreur dans bsda/types@BsdaWithGroupedInInclude
      // qui faisait qu'on indexait `forwardedIn` au lieu de `groupedIn`
      where: { groupedInId: { not: null } },
      select: { id: true }
    });

    // Re-index
    for (const bsda of bsdas) {
      // ~ 23 000 bordereaux en prod
      // select count(*) from "default$default"."Bsda" where "groupedInId" is not null;
      await enqueueUpdatedBsdToIndex(bsda.id);
    }
  }
}
