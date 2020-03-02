import { prisma, User } from "../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";

/**
 * Revoke a token
 */
export async function revokeToken(token: string, user: User) {
  const revokedTokenCount = await prisma
    .updateManyAccessTokens({
      where: { token, user: { id: user.id } },
      data: { isRevoked: true }
    })
    .count();

  if (parseInt(revokedTokenCount, 10) === 0) {
    throw new UserInputError("Ce token n'existe pas", {
      invalidArgs: ["token"]
    });
  }

  return true;
}
