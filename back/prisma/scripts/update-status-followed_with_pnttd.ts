import prisma from "../../src/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Set status FOLLOWED_WITH_PNTTD when next destination is foreign and tracability is not broken",
  "Set status FOLLOWED_WITH_PNTTD when next destination is foreign and tracability is not broken",
  true
)
export class UpdateBsddStatusFollowedWithPnttd implements Updater {
  async run() {
    await prisma.form.updateMany({
      data: {
        status: "FOLLOWED_WITH_PNTTD"
      },
      where: {
        status: "AWAITING_GROUP",
        noTraceability: false,
        nextDestinationCompanyCountry: { not: "FR" }
      }
    });
  }
}
