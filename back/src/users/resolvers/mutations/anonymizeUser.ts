import { nanoid } from "nanoid";
import { User } from "@prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAdmin } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { UserInputError } from "apollo-server-core";
import { PRISMA_TRANSACTION_TIMEOUT } from "../../../common/repository/helper";
import { PrismaTransaction } from "../../../common/repository/types";
import { hashPassword } from "../../utils";
import {
  getUserSessions,
  USER_SESSIONS_CACHE_KEY
} from "../../../common/redis/users";
import { redisClient } from "../../../common/redis";
import { sess } from "../../../server";

export async function checkCompanyAssociations(user: User): Promise<string[]> {
  const errors = [];
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: {
      user: {
        id: user.id
      }
    },
    include: {
      company: { select: { id: true } }
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
        `Impossible de supprimer cet utilisateur car il est le seul administrateur de l'entreprise ${association.company.id}.`
      );
    }
  }

  return errors;
}

export async function checkApplications(user: User): Promise<string[]> {
  const errors = [];
  const applications = await prisma.application.findMany({
    where: {
      adminId: user.id
    }
  });
  for (const application of applications) {
    errors.push(
      `Impossible de supprimer cet utilisateur car il est le seul administrateur de l'application ${application.id}.`
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

export async function deleteAllUserSessions(userId: string) {
  const sessions = await getUserSessions(userId);
  sessions.forEach(sessionId => sess.store.destroy(sessionId));
  await redisClient.del(`${USER_SESSIONS_CACHE_KEY}-${userId}`);
}

/**
 * Soft-delete by anonymizing a User
 * @param userId
 */
async function anonymizeUserFn(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UserInputError(`Utilisateur ${userId} introuvable`);
  }
  const errors = [
    ...(await checkCompanyAssociations(user)),
    ...(await checkApplications(user))
  ];

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const uuid = nanoid();
  const anonEmail = `${uuid}-anonymous@trackdechets.fr`;
  try {
    await prisma.$transaction(
      async transaction => {
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
            password: await hashPassword(nanoid())
          }
        });
        await deleteAllUserSessions(user.id);
      },
      { timeout: PRISMA_TRANSACTION_TIMEOUT }
    );

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
