import { prisma } from "../../generated/prisma-client";

/**
 * Returns the role (ADMIN or MEMBER) of a user
 * in a company.
 * Returns null if the user is not a member of the company.
 * There should be only one association between a user
 * and a company, so we return the first one
 * @param userId
 * @param siret
 */
export async function getUserRole(userId: string, siret: string) {
  const associations = await prisma.companyAssociations({
    where: { user: { id: userId }, company: { siret } }
  });
  if (associations.length > 0) {
    return associations[0].role;
  }
  return null;
}
