import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Set default value of FR for next destination company country",
  "Set default value of FR for next destination company country",
  false
)
export class UpdateNextDestinationCountry implements Updater {
  async run() {
    await prisma.form.updateMany({
      data: {
        nextDestinationCompanyCountry: "FR"
      },
      where: {
        nextDestinationCompanySiret: { not: null },
        nextDestinationCompanyCountry: null
      }
    });
  }
}
