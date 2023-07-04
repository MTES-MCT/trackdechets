import { UserInputError } from "apollo-server-express";
import { compare } from "bcrypt";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationChangePasswordArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { checkPasswordCriteria } from "../../utils";
import { updateUserPassword } from "../../database";
import { storeUserSessionsId } from "../../../common/redis/users";
import { clearUserSessions } from "../../clearUserSessions";

/**
 * Change user password
 */
export async function changePasswordFn(
  userId: string,
  { oldPassword, newPassword }: MutationChangePasswordArgs,
  currentSessionId: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`Cannot find user ${userId}`);
  }
  const passwordValid = await compare(oldPassword, user.password);
  if (!passwordValid) {
    throw new UserInputError("L'ancien mot de passe est incorrect.", {
      invalidArgs: ["oldPassword"]
    });
  }

  const trimmedPassword = newPassword.trim();

  checkPasswordCriteria(trimmedPassword);

  const updatedUser = await updateUserPassword({
    userId: user.id,
    trimmedPassword
  });

  // bust opened sessions to disconnect user from all devices and browsers
  // current user session is regenerated thanks to graphqlRegenerateSessionMiddleware,
  // but not yet referenced is userSessionsIds, so user is not disconnected
  await clearUserSessions(user.id);
  // store session reference
  await storeUserSessionsId(user.id, currentSessionId);

  return {
    ...updatedUser,
    // companies are resolved through a separate resolver (User.companies)
    companies: [],
    featureFlags: []
  };
}

const changePasswordResolver: MutationResolvers["changePassword"] = (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);

  const user = checkIsAuthenticated(context);

  return changePasswordFn(user.id, args, context.req.sessionID);
};

export default changePasswordResolver;
