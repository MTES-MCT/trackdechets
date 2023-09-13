import { addQuantityGrouped } from "../../src/scripts/prisma/addQuantityGrouped";
import { Updater, registerUpdater } from "./helper/helper";

@registerUpdater(
  "Compute quantityGrouped for all grouped forms",
  "Compute quantityGrouped for all grouped forms",
  true
)
export class ComputeQuantityGroupedUpdater implements Updater {
  async run() {
    await addQuantityGrouped();
  }
}
