import axios from "axios";
import { Updater, registerUpdater } from ".";
import { prisma } from "../../src/generated/prisma-client";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@registerUpdater(
  "Set company name, gerepid and code naf",
  `Populate fields name, gerepId and codeNaf on company records for analytics purpose`,
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
          const response = await axios.get(
            `http://td-insee:81/siret/${company.siret}`
          );

          if (response.status === 200) {
            const companyInfo = response.data;

            console.log(companyInfo);

            await prisma.updateCompany({
              data: {
                name: companyInfo.name,
                gerepId: companyInfo.codeS3ic,
                codeNaf: companyInfo.naf
              },
              where: {
                id: company.id
              }
            });
          } else {
            console.log(`Received status code ${response.status}`, response);
          }
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
