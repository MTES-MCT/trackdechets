import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Set takenOverAt = emittedAt for all BSDDs where emittedAt > takenOverAt",
  "Set takenOverAt = emittedAt for all BSDDs where emittedAt > takenOverAt",
  true
)
export class UpdateBSDDTakenOverAt implements Updater {
  async run() {
    const nbr: number =
      await prisma.$executeRaw`update "default$default"."Form" 
      set "takenOverAt" = "emittedAt" 
      where "emittedAt" > "takenOverAt";`;

    console.info(`${nbr} BSDDs updated`);
  }
}
