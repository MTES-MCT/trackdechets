import { prisma, User } from "../../generated/prisma-client";
import { DomainError, ErrorCode } from "../../common/errors";

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
    throw new DomainError("Ce token n'existe pas", ErrorCode.NOT_FOUND);
  }

  return true;
}
