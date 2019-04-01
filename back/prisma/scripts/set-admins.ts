import { prisma } from "../../src/generated/prisma-client";
import { Updater, registerUpdater } from ".";

@registerUpdater(
  "Set admins",
  `For companies that don't have an admin, use the only user in the company and give him the role`
)
export class SetAdminUpdater implements Updater {
  run() {
    console.info("Starting script to set companies admins...");

    try {
      return prisma
        .companies({ where: { admin: null } })
        .then(async companies => {
          console.info(`-> ${companies.length} companies found with no admin.`);
          const users = await prisma.users({
            where: { companies_some: { id_in: companies.map(c => c.id) } }
          });

          console.info(
            `-> ${users.length} users identified to fill the admin roles`
          );

          if (companies.length < users.length) {
            console.error("✗ too many potential admins, aborting");
            return;
          }

          const updates = users.map(async ({ id, name }) => {
            const userCompanies = await prisma.user({ id }).companies();
            const company = userCompanies.find(uc =>
              companies.map(c => c.id).includes(uc.id)
            );
            return prisma
              .updateCompany({
                where: { id: company.id },
                data: { admin: { connect: { id } } }
              })
              .then(_ =>
                console.info(`✓ ${company.siret} now has ${name} as admin`)
              );
          });

          return Promise.all(updates).then(_ =>
            console.info(`⚡ Update done.`)
          );
        });
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
