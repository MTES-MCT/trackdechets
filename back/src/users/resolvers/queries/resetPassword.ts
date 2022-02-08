import { QueryResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
/**
 * This query is used to check if the invitation hash is valid
 * or if the user has already joined when clicking the invitation
 * link sent by email
 */
const resetPasswordResolver: QueryResolvers["resetPassword"] = async (
  _,
  { hash }
) => {
  const resetHash = await prisma.userResetPasswordHash.findFirst({
    where: { hash }
  });
  const now = new Date();
  if (!resetHash || resetHash.hashExpires < now) {
    return false;
  }
  const user = await prisma.user.findUnique({
    where: { id: resetHash.userId }
  });
  // Thanks to referential integrity, this shouldn't happen
  if (!user) {
    return false;
  }
  return true;
};

export default resetPasswordResolver;
