import { prisma } from "@td/prisma";
import { registerUpdater, Updater } from "./helper/helper";

@registerUpdater(
  "Add the eco-organisme type",
  "Add the eco-organisme company type to the existing eco-organismes",
  false
)
export class AddEcoOrganismeType implements Updater {
  async run() {
    const ecoOrganismes = await prisma.ecoOrganisme.findMany();
    for (const ecoOrganisme of ecoOrganismes) {
      const company = await prisma.company.findUnique({
        where: {
          siret: ecoOrganisme.siret
        }
      });

      if (company && !company.companyTypes.includes("ECO_ORGANISME")) {
        await prisma.company.update({
          data: {
            companyTypes: {
              set: company.companyTypes.concat(["ECO_ORGANISME"])
            }
          },
          where: {
            id: company.id
          }
        });
      }
    }
  }
}
