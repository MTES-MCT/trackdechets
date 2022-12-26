import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";

@registerUpdater(
  "Clean SIRET when copy of VAT",
  "Clean SIRET when copy of VAT",
  true
)
export class FixCompanySiretIsVatUpdater implements Updater {
  async run() {
    try {
      await prisma.$queryRaw`UPDATE "default$default"."Company" SET "siret" = REGEXP_REPLACE("siret", '^\\w\\w', '') WHERE "vatNumber" = "siret" AND "siret" ~ '\\w\\w'`;
    } catch (err) {
      console.error("☠ Something went wrong during the UPDATE of Company", err);
      throw new Error();
    }
  }
}
