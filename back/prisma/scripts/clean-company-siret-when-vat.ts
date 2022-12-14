import { Updater, registerUpdater } from "./helper/helper";
import prisma from "../../src/prisma";
import { Company } from ".prisma/client";

@registerUpdater(
  "Clean SIRET when copy of VAT",
  "Clean SIRET when copy of VAT",
  true
)
export class FixCompanySiretIsVatUpdater implements Updater {
  async run() {
    try {
      const companies: Company[] =
        await prisma.$queryRaw`SELECT "id", "siret" FROM "default$default"."Company" WHERE "vatNumber" = "siret" AND "siret" ~ '\\w\\w'`;

      for (const company of companies) {
        try {
          await prisma.company.update({
            data: {
              siret: ""
            },
            where: { id: company.id }
          });
        } catch (_) {
          console.log(
            `Failed deleting SIRET numbers for Company ${company.siret}`
          );
        }
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
