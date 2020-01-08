import { Updater, registerUpdater } from ".";
import { prisma } from "../../src/generated/prisma-client";

type Association = {
  id: string;
  user: { email: string };
  company: { siret: string };
};

@registerUpdater(
  "Make company associations unique for a pair (company, user)",
  "Previously it was possible de create multiple associations between a user and a company. \
  Keep only the most privileged association"
)
export class DedupCompanyAssociationsUpdater implements Updater {
  async run() {
    console.info(
      "Starting script to make company associations unique for a pair (company, user)"
    );
    dedupCompanyAssociations();
  }
}

/**
 * Perform the actual update
 */
export async function dedupCompanyAssociations() {
  try {
    // retrieves company associations
    const associations = await prisma
      .companyAssociations()
      .$fragment<Association[]>(
        `fragment Details on CompanyAssociation { id user { email } company { siret } role }`
      );

    // group association by pair (user, company)
    const groups = associations.reduce((prev, cur) => {
      const key = `${cur.user.email}-${cur.company.siret}`;
      (prev[key] = prev[key] || []).push(cur);
      return prev;
    }, {});

    // iterate over each groups and delete duplicate associations
    Object.keys(groups).map(async key => {
      const group = groups[key];

      if (group.length > 1) {
        // group.length > 1 so we have duplicates

        const associationsToDelete = [];

        const adminAssociations = group.filter(a => a.role === "ADMIN");
        const memberAssociations = group.filter(a => a.role === "MEMBER");

        if (adminAssociations.length > 0) {
          // keep first admin association and delete all member associations
          const [_, ...tailAdminAssociations] = adminAssociations;
          [...memberAssociations, ...tailAdminAssociations].forEach(a =>
            associationsToDelete.push(a)
          );
        } else {
          // keep first member association
          const [_, ...tailMemberAssociations] = memberAssociations;
          tailMemberAssociations.forEach(a => associationsToDelete.push(a));
        }

        await prisma.deleteManyCompanyAssociations({
          id_in: associationsToDelete.map(a => a.id)
        });
      }
    });
  } catch (err) {
    console.error("☠ Something went wrong during the update", err);
    throw new Error();
  }
}
