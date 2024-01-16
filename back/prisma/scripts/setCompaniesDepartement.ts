import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "@td/prisma";
import { addToSetCompanyDepartementQueue } from "../../src/queue/producers/company";

@registerUpdater(
  "Set companies departements",
  "Set companies departements",
  false
)
export class SetCompaniesDepartement implements Updater {
  async run() {
    async function setCompaniesDepartement({
      skip = 0
    }: { skip?: number } = {}) {
      const take = 10000;
      const companies = await prisma.company.findMany({
        skip,
        take,
        where: { codeDepartement: null },
        select: { siret: true }
      });

      if (companies.length === 0) {
        return;
      }

      for (const company of companies) {
        if (company.siret?.length) {
          addToSetCompanyDepartementQueue({
            siret: company.siret
          });
        }
      }

      console.log(
        `Added ${
          skip + companies.length
        } companies to the setCompanyDepartement job queue`
      );

      return setCompaniesDepartement({ skip: skip + take });
    }

    await setCompaniesDepartement();
  }
}
