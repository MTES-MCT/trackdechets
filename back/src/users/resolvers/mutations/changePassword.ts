import { prisma } from "../../../generated/prisma-client";
import { compare } from "bcrypt";
import { UserInputError } from "apollo-server-express";
import {
  MutationChangePasswordArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { hashPassword } from "../../utils";

/**
 * Change user password
 */
export async function changePasswordFn(
  userId: string,
  { oldPassword, newPassword }: MutationChangePasswordArgs
) {
  const user = await prisma.user({ id: userId });
  const passwordValid = await compare(oldPassword, user.password);
  if (!passwordValid) {
    throw new UserInputError("L'ancien mot de passe est incorrect.", {
      invalidArgs: ["oldPassword"]
    });
  }

  const hashedPassword = await hashPassword(newPassword);

  return prisma.updateUser({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

const changePasswordResolver: MutationResolvers["changePassword"] = (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);

  const user = checkIsAuthenticated(context);

  return changePasswordFn(user.id, args);
};

export default changePasswordResolver;
