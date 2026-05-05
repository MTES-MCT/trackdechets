import { compare } from "bcrypt";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  MutationChangePasswordArgs,
  MutationResolvers
} from "@td/codegen-back";
import { checkPasswordCriteria } from "../../utils";
import { updateUserPassword } from "../../database";
import { UserInputError } from "../../../common/errors";

/**
 * Change user password
 */
export async function changePasswordFn(
  userId: string,
  { oldPassword, newPassword }: MutationChangePasswordArgs
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

  // Delete all password reset hashes
  await prisma.userResetPasswordHash.deleteMany({
    where: { userId: user.id }
  });

  const trimmedPassword = newPassword.trim();

  checkPasswordCriteria(trimmedPassword);

  const updatedUser = await updateUserPassword({
    userId: user.id,
    trimmedPassword
  });

  return {
    ...updatedUser,
    // companies are resolved through a separate resolver (User.companies)
    companies: [],
    featureFlags: []
  };
}

const changePasswordResolver: MutationResolvers["changePassword"] = async (
  _,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);

  const user = checkIsAuthenticated(context);

  const result = await changePasswordFn(user.id, args);
  // Update session issuedAt to prevent invalidation by invalidSessionMiddleware
  context.req.session.issuedAt = new Date().toISOString();

  return result;
};

export default changePasswordResolver;
