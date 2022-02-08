import { UserInputError } from "apollo-server-express";

import prisma from "../../../prisma";

import {
  MutationUpdatePasswordArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { hashPassword, isPasswordLongEnouh } from "../../utils";

/**
 * Change user password
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

  if (!isPasswordLongEnouh(newPassword)) {
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
