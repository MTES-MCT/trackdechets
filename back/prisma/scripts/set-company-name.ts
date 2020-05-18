import { Updater, registerUpdater } from ".";
import { setCompanyName } from "../../src/scripts/prisma/set-company-name";

@registerUpdater(
  "Set company name for records where it was not set at creation",
  `Populate field name`,
  false
)
export class SetCompanyNameUpdater implements Updater {
  async run() {
    console.info("Starting script to populate names");
    try {
      await setCompanyName();
      console.log("Done updating");
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
