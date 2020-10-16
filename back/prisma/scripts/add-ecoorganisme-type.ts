import { prisma } from "../../src/generated/prisma-client";
import { Updater, registerUpdater } from "./helper/helper";

@registerUpdater(
  "Add the eco-organisme type",
  "Add the eco-organisme company type to the existing eco-organismes",
  true
)
export class AddEcoOrganismeType implements Updater {
  async run() {
    const ecoOrganismes = await prisma.ecoOrganismes();
    for (const ecoOrganisme of ecoOrganismes) {
      const company = await prisma.company({
        siret: ecoOrganisme.siret
      });

      if (company && !company.companyTypes.includes("ECO_ORGANISME")) {
        await prisma.updateCompany({
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
