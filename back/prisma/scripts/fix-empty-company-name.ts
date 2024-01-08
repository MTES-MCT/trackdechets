import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "@td/prisma";
import { searchCompany } from "../../src/companies/search";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@registerUpdater(
  "Fix name and address to companies",
  "Fix name and address to companies",
  false
)
export class FixNameAddressCompanyUpdater implements Updater {
  async run() {
    try {
      const companies = await prisma.company.findMany({
        where: {
          OR: [{ name: "---" }, { name: "" }]
        }
      });
      for (const company of companies) {
        try {
          if (!company.siret) continue;
          const companyInfo = await searchCompany(company.siret);
          await prisma.company.update({
            data: {
              name:
                companyInfo.name !== "---" && companyInfo.name
                  ? companyInfo.name
                  : "",
              address:
                companyInfo.address !== "---" && companyInfo.address
                  ? companyInfo.address
                  : ""
            },
            where: { id: company.id }
          });
        } catch (_) {
          console.log(
            `Failed retrieving address and name info for SIRET ${company.siret}`
          );
        } finally {
          // Wait some time to avoid 429 Too many requests
          await sleep(200);
        }
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
