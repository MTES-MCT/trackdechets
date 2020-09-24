import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "../../src/generated/prisma-client";

@registerUpdater(
  "Set default value of FR for next destination company country",
  "Set default value of FR for next destination company country",
  true
)
export class UpdateNextDestinationCountry implements Updater {
  async run() {
    await prisma.updateManyForms({
      data: {
        nextDestinationCompanyCountry: "FR"
      },
      where: {
        nextDestinationCompanySiret_not: null,
        nextDestinationCompanyCountry: null
      }
    });
  }
}
