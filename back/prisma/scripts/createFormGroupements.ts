import createFormGroupements from "../../src/scripts/prisma/createFormGroupements";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Create FormGroupement and fill quantityGrouped",
  "Create FormGroupement and fill quantityGrouped",
  true
)
export class CreateFormGroupement implements Updater {
  async run() {
    console.info("Starting script to create FormGroupement...");
    await createFormGroupements();
  }
}
