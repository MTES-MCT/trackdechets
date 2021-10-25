import { BsffType, Prisma, WasteAcceptationStatus } from ".prisma/client";
import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Update bsff after harmonization",
  "Update bsff after harmonization",
  true
)
export class UpdateBsff implements Updater {
  async run() {
    const bsffs = await prisma.bsff.findMany({
      include: { previousBsffs: true }
    });
    for (const bsff of bsffs) {
      const data: Prisma.BsffUpdateInput = {};

      if (bsff.destinationReceptionSignatureDate) {
        data.destinationReceptionAcceptationStatus =
          bsff.destinationReceptionRefusalReason?.length > 0
            ? WasteAcceptationStatus.REFUSED
            : WasteAcceptationStatus.ACCEPTED;
      }

      if (bsff.previousBsffs.length > 0) {
        if (bsff.type === BsffType.REEXPEDITION) {
          data.forwarding = { connect: { id: bsff.previousBsffs[0].id } };
        }
        if (bsff.type === BsffType.RECONDITIONNEMENT) {
          data.repackaging = {
            connect: bsff.previousBsffs.map(previousBsff => ({
              id: previousBsff.id
            }))
          };
        }
        if (bsff.type === BsffType.GROUPEMENT) {
          data.grouping = {
            connect: bsff.previousBsffs.map(previousBsff => ({
              id: previousBsff.id
            }))
          };
        }
        data.previousBsffs = {
          disconnect: bsff.previousBsffs.map(previousBsff => ({
            id: previousBsff.id
          }))
        };
      }

      if (Object.keys(data).length > 0) {
        await prisma.bsff.update({ where: { id: bsff.id }, data });
      }
    }
  }
}
