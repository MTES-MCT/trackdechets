import { UserInputError } from "apollo-server-express";

import prisma from "../../../prisma";

import {
  MutationResetPasswordArgs,
  MutationResolvers
} from "@trackdechets/codegen/src/back.gen";
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
  if (!isPasswordLongEnough(trimmedPassword)) {
    throw new UserInputError("Mot de passe trop court.");
  }
  const user = await prisma.user.findUnique({
    where: { id: resetHash.userId }
  });

  const hashedPassword = await hashPassword(trimmedPassword);

  await prisma.user.update({
    where: { id: user.id },

    data: { password: hashedPassword }
  });
  await prisma.userResetPasswordHash.delete({
    where: { hash }
  });
  return true;
};

export default resetPasswordResolver;
