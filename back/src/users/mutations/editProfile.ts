import { prisma } from "../../generated/prisma-client";
import { MutationEditProfileArgs } from "../../generated/graphql/types";

/**
 * Edit user profile
 * Each field can be edited separately so we need to handle
 * undefined values
 * @param userId
 * @param payload
 */
export function editProfile(userId: string, payload: MutationEditProfileArgs) {
  const { name, phone, email } = payload;

  const data = {
    ...(name !== undefined ? { name } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(email !== undefined ? { email } : {})
  };

  return prisma.updateUser({
    where: { id: userId },
    data
  });
}
