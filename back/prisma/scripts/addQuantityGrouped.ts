import { addQuantityGrouped } from "../../src/scripts/prisma/addQuantityGrouped";
import { Updater, registerUpdater } from "./helper/helper";

@registerUpdater(
  "Compute quantiyGrouped for all grouped forms",
  "Compute quantiyGrouped for all grouped forms",
  true
)
export class ComputeQuantityGroupedUpdater implements Updater {
  async run() {
    await addQuantityGrouped();
  }
}
