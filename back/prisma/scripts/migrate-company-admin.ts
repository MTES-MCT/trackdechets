import { registerUpdater, Updater } from ".";
import { prisma } from "../../src/generated/prisma-client";

type Company = { id: string; admin: { id: string } };

@registerUpdater(
  "Migrate from company admin to company admins",
  `The model is evolving: companies can now have N admins. We migrate from admin to admins with an s`
)
export class SetAdminUpdater implements Updater {
  async run() {
    console.info("Starting script to set companies admins...");
    try {
      const companies: Company[] = await prisma.companies().$fragment(
        `
        fragment CompanyWithAdmins on Company {
          id
          admin { id }
        }
        `
      );

      const updates = companies
        .filter(c => c.admin)
        .map(company =>
          prisma.updateCompany({
            where: { id: company.id },
            data: { admins: { connect: { id: company.admin.id } } }
          })
        );

      return Promise.all(updates)
        .then(_ => console.info(`⚡ Update done.`))
        .catch(err => console.error("Error while updating companies", err));
    } catch (err) {
      console.info(`✗ Nothing to update, aborting.`);
    }
  }
}
