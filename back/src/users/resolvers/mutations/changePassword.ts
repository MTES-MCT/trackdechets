import { UserInputError } from "apollo-server-express";
import { compare } from "bcrypt";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationChangePasswordArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { hashPassword } from "../../utils";

/**
 * Change user password
 */
export async function changePasswordFn(
  userId: string,
  { oldPassword, newPassword }: MutationChangePasswordArgs
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const passwordValid = await compare(oldPassword, user.password);
  if (!passwordValid) {
    throw new UserInputError("L'ancien mot de passe est incorrect.", {
      invalidArgs: ["oldPassword"]
    });
  }

  const hashedPassword = await hashPassword(newPassword);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return {
    ...updatedUser,
    // companies are resolved through a separate resolver (User.companies)
    companies: []
  };
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
