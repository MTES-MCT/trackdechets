import { Updater, registerUpdater } from "./helper/helper";
import { prisma, CompanyType } from "../../src/generated/prisma-client";

@registerUpdater(
  "Set companyType",
  `The type of the company used to be set on the User (field userType).
  Set this information on the Company (field companyType).
  If a company has several users, we merge the types of the different users`,
  false
)
export class SetCompanyTypeUpdater implements Updater {
  run() {
    console.info("Starting script to set companyType...");
    return setCompanyType();
  }
}

/**
 * Performs the actual update
 *
 */
export async function setCompanyType() {
  try {
    // List all companies
    const companies = await prisma.companies();

    const updates = [];

    type User = {
      userType: [string];
    };

    const fragment = `
    fragment AssociationWithCompany on CompanyAssociation {
      user { userType }
    }
    `;

    for (const company of companies) {
      // retrieves the userType of each user
      // associated to this company
      const userTypes = await prisma
        .companyAssociations({
          where: { company: { id: company.id } }
        })
        .$fragment<{ user: User }[]>(fragment)
        .then(associations => associations.map(a => a.user.userType));

      // merge types
      const companyTypes = mergeUserTypes(userTypes) as CompanyType[];

      // update the company
      const update = prisma.updateCompany({
        data: { companyTypes: { set: companyTypes } },
        where: { id: company.id }
      });

      updates.push(update);
    }

    return await Promise.all(updates);
  } catch (err) {
    console.error("☠ Something went wrong during the update", err);
    throw new Error();
  }
}

/**
 * Merge a list of userType
 * @param userTypes
 *
 * Behavior
 * const userTypes = [[PRODUCER], [PRODUCER, WASTEPROCESSOR], [TRANSPORTER]]
 * mergeUserrTypes(userTypes) yields [PRODUCER, WASTEPROCESSOR, TRANSPORTER]
 */
export function mergeUserTypes(userTypes) {
  // remove null values or empty array
  const notNullUserTypes = userTypes.filter(t => !!t);
  const reducer = (accumulator, currentValue) => {
    const set = new Set([...accumulator, ...currentValue]);
    return Array.from(set);
  };
  return notNullUserTypes.reduce(reducer, []);
}
