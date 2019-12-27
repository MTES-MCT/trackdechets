import { prisma } from "../../generated/prisma-client";

type Payload = {
  name?: string;
  phone?: string;
  email?: string;
};

/**
 * Edit user profile
 * Each field can be edited separately so we need to handle
 * undefined values
 * @param userId
 * @param payload
 */
export function editProfile(userId: string, payload: Payload) {
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
