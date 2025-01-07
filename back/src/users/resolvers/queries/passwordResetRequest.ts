import type { QueryResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
/**
 * This query is used to check if the invitation hash is valid
 * or if the user has already joined when clicking the invitation
 * link sent by email
 */
const passwordResetRequestResolver: QueryResolvers["passwordResetRequest"] =
  async (_, { hash }) => {
    const resetHash = await prisma.userResetPasswordHash.findFirst({
      where: { hash }
    });

    const now = new Date();
    if (!resetHash || resetHash.hashExpires < now) {
      return null;
    }

    return resetHash.id;
  };

export default passwordResetRequestResolver;
