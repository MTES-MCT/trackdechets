import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Set status FOLLOWED_WITH_PNTTD when next destination is foreign and tracability is not broken",
  "Set status FOLLOWED_WITH_PNTTD when next destination is foreign and tracability is not broken",
  false
)
export class UpdateBsddStatusFollowedWithPnttd implements Updater {
  async run() {
    // ensure nextDestinationCompanyCountry is always set to FR
    await prisma.form.updateMany({
      data: {
        nextDestinationCompanyCountry: "FR"
      },
      where: {
        nextDestinationCompanySiret: { not: null },
        nextDestinationCompanyCountry: null
      }
    });
    // update data.
    await prisma.form.updateMany({
      data: {
        status: "FOLLOWED_WITH_PNTTD"
      },
      where: {
        status: "AWAITING_GROUP",
        groupedIn: undefined,
        noTraceability: false,
        nextDestinationCompanyCountry: { not: "FR" }
      }
    });
  }
}
