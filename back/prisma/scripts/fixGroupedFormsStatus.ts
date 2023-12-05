import { fixedGroupedFormsStatus } from "../../src/scripts/prisma/fixGroupedFormsStatus";
import { Updater, registerUpdater } from "./helper/helper";

@registerUpdater(
  "Fix status of grouped BSDs with temp storage",
  "Fix status of grouped BSDs with temp storage",
  false
)
export class FixGroupedFormsStatusUpdater implements Updater {
  async run() {
    await fixedGroupedFormsStatus();
  }
}
