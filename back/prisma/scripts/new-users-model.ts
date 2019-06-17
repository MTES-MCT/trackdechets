import { registerUpdater, Updater } from ".";
import { prisma } from "../../src/generated/prisma-client";

type UsersInfos = {
  id: string;
  companies: { id: string; admin: { id: string } }[];
};

@registerUpdater(
  "Migrate to new users <-> companies model association",
  `The model is evolving: CompanyAssociation has been introduced, lonking users and companies with the specfied role`,
  false
)
export class NewUserModelUpdater implements Updater {
  async run() {
    console.info("Starting script to set companies admins...");
    try {
      const userInfos = await prisma.users().$fragment<UsersInfos[]>(
        `
        fragment UserWithCompanies on User {
          id companies { id admin { id } }
        }
        `
      );

      const updates = userInfos
        .map(userInfo =>
          userInfo.companies.map(c => ({
            userId: userInfo.id,
            companyId: c.id,
            isAdmin: c.admin.id === userInfo.id
          }))
        )
        .reduce((a, b) => a.concat(b), [])
        .map(({ userId, companyId, isAdmin }) =>
          prisma.createCompanyAssociation({
            company: { connect: { id: companyId } },
            user: { connect: { id: userId } },
            role: isAdmin ? "ADMIN" : "MEMBER"
          })
        );

      return Promise.all(updates)
        .then(_ => console.info(`⚡ Update done.`))
        .catch(err => console.error("Error while updating companies", err));
    } catch (err) {
      console.error("☠ Something went wrong during the update", err);
      throw new Error();
    }
  }
}
