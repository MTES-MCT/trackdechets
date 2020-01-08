import { prisma, User, UserRole } from "../../generated/prisma-client";
import { DomainError, ErrorCode } from "../../common/errors";

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
    throw new DomainError(
      "L'utilisateur est déjà membre de l'établissement",
      ErrorCode.BAD_USER_INPUT
    );
  }

  return prisma.createCompanyAssociation({
    user: { connect: { id: userId } },
    role,
    company: { connect: { siret } }
  });
}
