import { UserInputError } from "apollo-server-express";

import prisma from "../../../prisma";

import {
  MutationUpdatePasswordArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { hashPassword, isPasswordLongEnough } from "../../utils";

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
const updatePasswordResolver: MutationResolvers["updatePassword"] = async (
  parent,
  { newPassword, hash }: MutationUpdatePasswordArgs
) => {
  const now = new Date();
  const resetHash = await prisma.userResetPasswordHash.findUnique({
    where: { hash }
  });

  if (!resetHash || resetHash.hashExpires < now) {
    throw new UserInputError("Lien invalide ou trop ancien.");
  }

  if (!isPasswordLongEnough(newPassword)) {
    throw new UserInputError("Mot de passe trop court.");
  }
  const user = await prisma.user.findUnique({
    where: { id: resetHash.userId }
  });
  if (!user) {
    throw new UserInputError("Lien invalide ou trop ancien.");
  }
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });
  await prisma.userResetPasswordHash.delete({
    where: { hash }
  });
  return true;
};

export default updatePasswordResolver;
