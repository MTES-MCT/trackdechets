import createForwardedInForms from "../../src/scripts/prisma/createForwardedInForms";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Migrate from TemporaryStorageDetail to forwardedIn Form",
  "Migrate from TemporaryStorageDetail to forwardedIn Form",
  false
)
export class CreateForwardedInForms implements Updater {
  async run() {
    console.info("Starting script to create forwardedIn forms...");
    await createForwardedInForms();
  }
}
