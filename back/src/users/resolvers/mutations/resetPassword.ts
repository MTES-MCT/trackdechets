import { prisma } from "@td/prisma";

import {
  MutationResetPasswordArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { checkPasswordCriteria } from "../../utils";
import { updateUserPassword } from "../../database";
import { clearUserSessions } from "../../clearUserSessions";
import { UserInputError } from "../../../common/errors";
/**
 * Update user password in a password reset workflow
 *
 * query the reset hash
 * check it is not expired
 * check password is long enough
 * update user password
 * delete userResetPasswordHash
 * throw UserInputError if any step fails
 */
const resetPasswordResolver: MutationResolvers["resetPassword"] = async (
  parent,
  { newPassword, hash }: MutationResetPasswordArgs
) => {
  const now = new Date();
  const resetHash = await prisma.userResetPasswordHash.findUnique({
    where: { hash }
  });

  if (!resetHash || resetHash.hashExpires < now) {
    throw new UserInputError("Lien invalide ou trop ancien.");
  }
  const trimmedPassword = newPassword.trim();

  const user = await prisma.user.findUnique({
    where: { id: resetHash.userId }
  });
  if (!user) {
    throw new Error(
      `Cannot find user ${resetHash.userId} for resetHash ${resetHash.id}`
    );
  }
  checkPasswordCriteria(trimmedPassword);

  await updateUserPassword({ userId: user.id, trimmedPassword });

  // delete all user related UserResetPasswordHash
  await prisma.userResetPasswordHash.deleteMany({
    where: { userId: user.id }
  });

  // bust opened sessions to disconnect user from all devices and browsers
  await clearUserSessions(user.id);

  return true;
};

export default resetPasswordResolver;
