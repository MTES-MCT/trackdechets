/**
 * PRISMA HELPER FUNCTIONS
 */

import { prisma } from "@td/prisma";

import { User, UserRole, Prisma, Company } from "@prisma/client";
import { hash } from "bcrypt";
import { getUid, sanitizeEmail, hashToken } from "../utils";
import { deleteCachedUserRoles } from "../common/redis/users";
import { hashPassword, passwordVersion } from "./utils";
import { UserInputError } from "../common/errors";
import { PrismaTransaction } from "../common/repository/types";

export async function getUserCompanies(userId: string): Promise<Company[]> {
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: { userId },
    include: { company: true }
  });
  return companyAssociations.map(association => association.company);
}

/**
 * Create a temporary association between an email and
 * a siret
 * @param email
 * @param role
 * @param siret
 */
export async function createUserAccountHash(
  email: string,
  role: UserRole,
  siret: string
) {
  // check for existing records
  const existingHashes = await prisma.userAccountHash.findMany({
    where: { email, companySiret: siret }
  });

  if (existingHashes && existingHashes.length > 0) {
    throw new UserInputError("Cet utilisateur a déjà été invité", {
      invalidArgs: ["email"]
    });
  }

  const userAccoutHash = await hash(
    new Date().valueOf().toString() + Math.random().toString(),
    10
  );

  return prisma.userAccountHash.create({
    data: {
      hash: userAccoutHash,
      email,
      role,
      companySiret: siret
    }
  });
}

/**
 * Delete UserAccountHash objects linked to a user's mail (association between user and siret with a hash)
 * @param user
 * @param prisma
 */
export async function deleteUserAccountHash(
  user: User,
  prisma: PrismaTransaction
) {
  await prisma.userAccountHash.deleteMany({
    where: { email: user.email }
  });
}

/**
 * Associate an existing user with company
 * Make sure we do not create a double association
 * @param userId
 * @param orgId
 * @param role
 */
export async function associateUserToCompany(
  userId,
  orgId,
  role,
  opt: Partial<Prisma.CompanyAssociationCreateInput> = {}
) {
  // check for current associations
  const associations = await prisma.companyAssociation.findMany({
    where: {
      user: {
        id: userId
      },
      company: {
        orgId
      }
    }
  });

  if (associations && associations.length > 0) {
    throw new UserInputError(
      "L'utilisateur est déjà membre de l'établissement"
    );
  }

  const association = await prisma.companyAssociation.create({
    data: {
      user: { connect: { id: userId } },
      role,
      company: { connect: { orgId } },
      ...opt
    }
  });

  // fill firstAssociationDate field if null (no need to update it if user was previously already associated)
  await prisma.user.updateMany({
    where: { id: userId, firstAssociationDate: null },
    data: { firstAssociationDate: new Date() }
  });

  // clear cache
  await deleteCachedUserRoles(userId);

  return association;
}

export async function getUserAccountHashOrNotFound(
  where: Prisma.UserAccountHashWhereInput
) {
  const userAccountHashes = await prisma.userAccountHash.findMany({
    where
  });
  if (userAccountHashes.length === 0) {
    throw new UserInputError("Cette invitation n'existe pas");
  }
  return userAccountHashes[0];
}

export async function getCompanyAssociationOrNotFound(
  where: Prisma.CompanyAssociationWhereInput
) {
  const companyAssociations = await prisma.companyAssociation.findMany({
    where
  });
  if (companyAssociations.length === 0) {
    throw new UserInputError(`L'utilisateur n'est pas membre de l'entreprise`);
  }
  return companyAssociations[0];
}

type CreateAccessTokenArgs = { user: User; description?: string };

export async function createAccessToken({
  user,
  description
}: CreateAccessTokenArgs) {
  const clearToken = getUid(40);

  const accessToken = await prisma.accessToken.create({
    data: {
      user: {
        connect: { id: user.id }
      },
      ...(description ? { description } : {}),
      token: hashToken(clearToken)
    }
  });
  return { ...accessToken, token: clearToken };
}

export async function userExists(unsafeEmail: string) {
  const count = await prisma.user.count({
    where: {
      email: sanitizeEmail(unsafeEmail)
    }
  });
  return count >= 1;
}

/**
 * Validate a user's pending invitations
 * @param user
 */
export async function acceptNewUserCompanyInvitations(user: User) {
  const existingHashes = await prisma.userAccountHash.findMany({
    where: { email: user.email }
  });

  if (!existingHashes.length) {
    return Promise.resolve();
  }

  await Promise.all(
    existingHashes.map(existingHash =>
      prisma.companyAssociation.create({
        data: {
          company: { connect: { orgId: existingHash.companySiret } },
          user: { connect: { id: user.id } },
          role: existingHash.role
        }
      })
    )
  );
  if (!user.firstAssociationDate) {
    await prisma.user.update({
      where: { id: user.id },
      data: { firstAssociationDate: new Date() }
    });
  }

  // clear cache
  await deleteCachedUserRoles(user.id);

  return prisma.userAccountHash.updateMany({
    where: {
      id: { in: existingHashes.map(h => h.id) }
    },
    data: { acceptedAt: new Date() }
  });
}

export async function getMembershipRequestOrNotFoundError(
  where: Prisma.MembershipRequestWhereUniqueInput
) {
  const membershipRequest = await prisma.membershipRequest.findUnique({
    where
  });
  if (!membershipRequest) {
    throw new UserInputError("Cette demande de rattachement n'existe pas");
  }
  return membershipRequest;
}

export async function createUser({
  data
}: {
  data: Omit<Prisma.UserCreateInput, "passwordVersion">;
}): Promise<User> {
  const user = await prisma.user.create({
    data: {
      ...data,
      passwordVersion
    }
  });
  return user;
}
export async function updateUserPassword({
  userId,
  trimmedPassword
}: {
  userId: string;
  trimmedPassword: string;
}): Promise<User> {
  const hashedPassword = await hashPassword(trimmedPassword);

  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, passwordVersion }
  });
}

export async function checkCompanyAssociations(user: User): Promise<string[]> {
  const errors: string[] = [];
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: {
      user: {
        id: user.id
      }
    },
    include: {
      company: { select: { id: true, siret: true, vatNumber: true } }
    }
  });

  for (const association of companyAssociations) {
    if (association.role !== "ADMIN") {
      continue;
    }

    const otherAdmins = await prisma.companyAssociation.findMany({
      where: {
        role: "ADMIN",
        user: {
          id: { not: user.id }
        },
        company: {
          id: association.company.id
        }
      }
    });
    if (otherAdmins.length <= 0) {
      errors.push(
        `Impossible de supprimer cet utilisateur car il est le seul administrateur de l'entreprise ${
          association.company.id
        } (SIRET OU TVA: ${
          association.company.siret ?? association.company.vatNumber
        }).`
      );
    }
  }

  return errors;
}

export async function checkApplications(user: User): Promise<string[]> {
  const errors: string[] = [];
  const applications = await prisma.application.findMany({
    where: {
      adminId: user.id
    }
  });
  for (const application of applications) {
    errors.push(
      `Impossible de supprimer cet utilisateur car il est le seul administrateur de l'application ${application.id} (${application.name}).`
    );
  }

  return errors;
}

export async function deleteUserCompanyAssociations(
  user: User,
  prisma: PrismaTransaction
) {
  await prisma.companyAssociation.deleteMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
}

export async function deleteMembershipRequest(
  user: User,
  prisma: PrismaTransaction
) {
  await prisma.membershipRequest.deleteMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
}

export async function deleteUserActivationHashes(
  user: User,
  prisma: PrismaTransaction
) {
  await prisma.userActivationHash.deleteMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
}

export async function deleteUserAccessTokens(
  user: User,
  prisma: PrismaTransaction
) {
  await prisma.accessToken.deleteMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
}

export async function deleteUserGrants(user: User, prisma: PrismaTransaction) {
  await prisma.grant.deleteMany({
    where: {
      user: {
        id: user.id
      }
    }
  });
}
