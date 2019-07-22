import { registerUpdater, Updater } from ".";
import { prisma } from "../../src/generated/prisma-client";

type Association = {
  id: string;
  user: { email: string };
  company: { siret: string };
};
@registerUpdater(
  "Correct company associations",
  `There should be no duplicates in the company associations. A problem with an updater created duplicates in the staging environemet`
)
export class NewUserModelUpdater implements Updater {
  async run(): Promise<any> {
    const associations = await prisma
      .companyAssociations()
      .$fragment<Association[]>(
        `fragment Details on CompanyAssociation { id user { email } company { siret } }`
      );

    const flatAssocations = associations.map(a => ({
      id: a.id,
      email: a.user.email,
      siret: a.company.siret
    }));

    const groups = flatAssocations.reduce((prev, cur) => {
      const key = `${cur.email}-${cur.siret}`;
      (prev[key] = prev[key] || []).push(cur);

      return prev;
    }, {});

    const promises = Object.keys(groups).map(key => {
      const associationsForCompanyAndUser = groups[key];
      if (associationsForCompanyAndUser.length === 1) {
        return;
      }

      const associationsIdsToDelete = associationsForCompanyAndUser
        .map(a => a.id)
        .splice(0, 1);

      console.info(
        `👓 Deleting ${associationsIdsToDelete.length} associations for ${key}`
      );
      return prisma.deleteManyCompanyAssociations({
        id_in: associationsIdsToDelete
      });
    });

    return Promise.all(promises)
      .then(_ => console.info(`⚡ Update done.`))
      .catch(err => console.error("🚨 Error while updating companies", err));
  }
}
