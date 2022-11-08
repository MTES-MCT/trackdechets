import updateBsffAcceptationOperation from "../../src/scripts/prisma/updateBsffAcceptationOperation";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Update BSFF acceptation, operation, grouping, forwarding and repackaging",
  "Update BSFF acceptation, operation, grouping, forwarding and repackaging",
  false
)

/**
 * This script migrate acceptation, operation, grouping, forwarding and repackaging info
 * from the BSFF level to the packaging level
 */
export class UpdateBsffAcceptationOperation implements Updater {
  async run() {
    await updateBsffAcceptationOperation();
  }
}
