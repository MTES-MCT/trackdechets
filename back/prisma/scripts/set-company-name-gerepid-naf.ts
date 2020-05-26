import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "../../src/generated/prisma-client";
import { searchCompany } from "../../src/companies/sirene";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@registerUpdater(
  "Set company name and code naf",
  `Populate fields name and codeNaf on company records for analytics purpose`,
  false
)
export class SetCampanyNameGerepNafUpdater implements Updater {
  async run() {
    console.info(
      "Starting script to populate name, gerepId and codeNaf on companies"
    );

    try {
      const companies = await prisma.companies();

      for (const company of companies) {
        console.log(`Populating fields for company ${company.siret}`);

        try {
          const companyInfo = await searchCompany(company.siret);

          await prisma.updateCompany({
            data: {
              name: companyInfo.name,
              codeNaf: companyInfo.naf
            },
            where: {
              id: company.id
            }
          });
        } catch (error) {
          console.log(error);
        }

        // Wait some time to avoid 429 Too many requests
        await sleep(1000);
      }
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
