/**
 * Prisma helpers function
 */

import { prisma, User } from "../generated/prisma-client";
import { FullUser } from "./types";

export async function getUserCompanies(userId: string) {
  const companyAssociations = await prisma
    .user({ id: userId })
    .companyAssociations();
  return Promise.all(
    companyAssociations.map(association => {
      return prisma.companyAssociation({ id: association.id }).company();
    })
  );
}

/**
 * Returns a user with linked objects
 * @param user
 */
export async function getFullUser(user: User): Promise<FullUser> {
  const companies = await getUserCompanies(user.id);
  return {
    ...user,
    companies
  };
}
