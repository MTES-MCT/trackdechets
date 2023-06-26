import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";
import { BsdasriType, BsdasriStatus } from "@prisma/client";
import { enqueueUpdatedBsdToIndex } from "../../src/queue/producers/elastic";
@registerUpdater(
  "Update groupable dasris to AWAITING_GROUP",
  "Update groupable dasris to AWAITING_GROUP",
  false
)
export class UpdateBsdasriStatusEligibleFirGrouping implements Updater {
  // PROCESSED dasri eligible for grouping should be in AWAITING_GROUP status. Also applies to grouped dasris whose grouping bsd is not already processed
  async run() {
    // select dasris
    // - PROCESSED
    // - code D12 or R12
    // are either
    // - not already grouped
    //- or grouped in another dasri (grouping) which is not already PROCESSED or REFUSED
    const toUpdate = await prisma.bsdasri.findMany({
      where: {
        type: BsdasriType.SIMPLE,
        status: BsdasriStatus.PROCESSED,
        destinationOperationCode: { in: ["D12", "R12"] },
        OR: [
          {
            groupedInId: null
          },
          {
            groupedIn: {
              status: {
                not: { in: [BsdasriStatus.PROCESSED, BsdasriStatus.REFUSED] }
              }
            }
          }
        ]
      },
      select: { id: true }
    });
    const toUpdateIds = toUpdate.map(bsd => bsd.id);
    const updated = await prisma.bsdasri.updateMany({
      where: { id: { in: toUpdateIds } },
      data: { status: BsdasriStatus.AWAITING_GROUP }
    });

    for (const bsdId of toUpdateIds) {
      await enqueueUpdatedBsdToIndex(bsdId);
    }
    console.log(`${updated.count} dasris where updated`);
  }
}
