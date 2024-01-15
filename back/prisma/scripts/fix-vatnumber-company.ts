import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "@td/prisma";
import { Company } from "@prisma/client";

@registerUpdater(
  "Clean Company VAT numbers",
  "Clean SIRET and VAT numbers in Company",
  false
)
export class FixVatCompanyUpdater implements Updater {
  async run() {
    try {
      const companies: Company[] =
        await prisma.$queryRaw`SELECT id, "vatNumber", siret FROM "default$default"."Company" WHERE "vatNumber" ~ '(\-|\.|\s)'
        `;
      for (const company of companies) {
        try {
          await prisma.company.update({
            data: {
              vatNumber: company.vatNumber?.replace(/[\W_]+/g, ""),
              siret: company.siret?.replace(/[\W_]+/g, "")
            },
            where: { id: company.id }
          });
        } catch (_) {
          console.log(
            `Failed fixing VAT and SIRET numbers for Company ${company.siret}`
          );
        }
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
