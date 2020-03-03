import { prisma } from "../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";

/**
 * Associate an existing user with company
 * Make sure we do not create a double association
 * @param userId
 * @param siret
 * @param role
 */
export async function associateUserToCompany(userId, siret, role) {
  // check for current associations
  const associations = await prisma.companyAssociations({
    where: {
      user: {
        id: userId
      },
      company: {
        siret
      }
    }
  });

  if (associations && associations.length > 0) {
    throw new UserInputError(
      "L'utilisateur est déjà membre de l'établissement"
    );
  }

  return prisma.createCompanyAssociation({
    user: { connect: { id: userId } },
    role,
    company: { connect: { siret } }
  });
}
