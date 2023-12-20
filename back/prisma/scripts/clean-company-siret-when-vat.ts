import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "@td/prisma";

@registerUpdater(
  "Clean SIRET when it's a copy of VAT",
  "Clean SIRET after enforcing SIRET validation",
  false
)
export class FixCompanySiretIsVatUpdater implements Updater {
  async run() {
    try {
      await prisma.$queryRaw`UPDATE "default$default"."Company" SET "siret" = NULL WHERE "vatNumber" = "siret" AND "siret" ~ '\\w\\w'`;
    } catch (err) {
      console.error("☠ Something went wrong during the UPDATE of Company", err);
      throw new Error();
    }
  }
}
