import axios from "axios";
import { Updater, registerUpdater } from ".";
import { prisma } from "../../src/generated/prisma-client";


@registerUpdater(
  "Set company name, gerepid and code naf",
  `Populate fields name, gerepId and codeNaf on company records for analytics purpose`
)
export class SetCampanyNameGerepNafUpdater implements Updater {
  run() {
    console.info("Starting script to populate name, gerepId and codeNaf on companies");

    try {

      return prisma.companies().then(async companies => {

        for (const company of companies) {
          const response = await axios.get(`http://td-insee:81/siret/${company.siret}`);
          if (response.status == 200) {
            const companyInfo = response.data;

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
          }
        }
      });

    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
