import { prisma } from "@td/prisma";
import type { MutationResolvers } from "@td/codegen-back";
import { checkIsAdmin } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { hashPassword } from "../../utils";
import { clearUserSessions } from "../../clearUserSessions";
import { getUid } from "../../../utils";
import { UserInputError } from "../../../common/errors";
import {
  checkCompanyAssociations,
  checkApplications,
  deleteUserCompanyAssociations,
  deleteUserActivationHashes,
  deleteUserAccessTokens,
  deleteUserGrants,
  deleteMembershipRequest
} from "../../database";

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
    throw new UserInputError(errors.join("\n"));
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
