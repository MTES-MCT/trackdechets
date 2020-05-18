import { Updater, registerUpdater } from ".";
import { prisma } from "../../src/generated/prisma-client";

@registerUpdater(
  "Set recipientIsTempStorage",
  `The new isTempStorage must have a value. We set it to false by default`,
  false
)
export class SetIsTempStorage implements Updater {
  run() {
    console.info("Starting script to set recipientIsTempStorage...");

    try {
      return prisma.updateManyForms({
        where: { recipientIsTempStorage: null },
        data: { recipientIsTempStorage: false }
      });
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
