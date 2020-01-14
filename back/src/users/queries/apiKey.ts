import { prisma, User } from "../../generated/prisma-client";
import { getUid } from "../../utils";

/**
 * DEPRECATED
 * Generate a new personal token and save it to the database
 * It will disappear in favor of OAuth2 implicit grant in the future
 */
export async function apiKey(user: User): Promise<string> {
  const token: string = getUid(40);

  const accessToken = await prisma.createAccessToken({
    user: {
      connect: { id: user.id }
    },
    token
  });

  return accessToken.token;
}
