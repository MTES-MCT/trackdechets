import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "../../src/generated/prisma-client";

@registerUpdater(
  "Migrate the forms to received forms to the new accepted status",
  "Replace RECEIVED with ACCEPTED, and TEMP_STORED to TEMP_STORER_ACCEPTED",
  false
)
export class MigrateAcceptedForms implements Updater {
  async run() {
    await prisma.updateManyForms({
      where: {
        status: "RECEIVED"
      },
      data: { status: "ACCEPTED" }
    });

    await prisma.updateManyForms({
      where: {
        status: "TEMP_STORED"
      },
      data: { status: "TEMP_STORER_ACCEPTED" }
    });
  }
}
