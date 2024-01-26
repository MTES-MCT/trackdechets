import { prisma } from "@td/prisma";

export const getUserAccountHash = async (siret: string, email: string) => {
  return prisma.userAccountHash.findFirst({
    where: {
      email: email,
      companySiret: siret
    }
  });
};
