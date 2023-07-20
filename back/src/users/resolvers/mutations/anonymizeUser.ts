import { User } from "@prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAdmin } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { PrismaTransaction } from "../../../common/repository/types";
import { hashPassword } from "../../utils";
import { clearUserSessions } from "../../clearUserSessions";
import { getUid } from "../../../utils";
import { UserInputError } from "../../../common/errors";

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

/**
 * Soft-delete by anonymizing a User
 * @param userId
 */
async function anonymizeUserFn(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    throw new UserInputError(`Utilisateur ${userId} introuvable`);
  }
  if (!user.isActive) {
    throw new UserInputError(`Utilisateur ${userId} déjà inactif`);
  }
  const errors = [
    ...(await checkCompanyAssociations(user)),
    ...(await checkApplications(user))
  ];

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const uuid = getUid(16);
  const anonEmail = `${uuid}-anonymous@trackdechets.fr`;
  try {
    await prisma.$transaction(async transaction => {
      await deleteUserCompanyAssociations(user, transaction);
      await deleteUserActivationHashes(user, transaction);
      await deleteUserAccessTokens(user, transaction);
      await deleteUserGrants(user, transaction);
      await deleteMembershipRequest(user, transaction);
      await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          email: anonEmail,
          name: uuid,
          isActive: false,
          phone: "00000000",
          password: await hashPassword(getUid(16))
        }
      });
      await clearUserSessions(user.id);
    });

    return anonEmail;
  } catch (err) {
    throw new UserInputError(`Impossible de supprimer cet utilisateur: ${err}`);
  }
}

const anonymizeUserResolver: MutationResolvers["anonymizeUser"] = (
  _,
  { id: userId },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);
  return anonymizeUserFn(userId);
};

export default anonymizeUserResolver;
