import { Updater, registerUpdater } from ".";
import {
  prisma,
  WasteAcceptationStatus
} from "../../src/generated/prisma-client";

@registerUpdater(
  "Set wasteAcceptationStatus",
  `The wasteAcceptationStatus properties was added to replace isAccepted`,
  true
)
export class SetFormUpdater implements Updater {
  async run() {
    console.info("Starting script to fill empty wasteAcceptationStatuses...");

    try {
      const forms = await prisma.forms({
        where: { isAccepted_not: null, wasteAcceptationStatus: null }
      });

      for (const frm of forms) {
        const wasteAcceptationStatus =
          frm.isAccepted === true ? "ACCEPTED" : "REFUSED";
        await prisma.updateForm({
          where: { id: frm.id },
          data: {
            wasteAcceptationStatus: wasteAcceptationStatus as WasteAcceptationStatus
          }
        });
      }
      console.info(`${forms.length} forms updated`);
      console.info(`⚡ Update done.`);
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
