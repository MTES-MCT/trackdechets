import { prisma } from "@td/prisma";

export const getHash = async (siret: string, email: string) => {
  return prisma.userAccountHash.findFirst({
    where: {
      email: email,
      companySiret: siret
    }
  });
};
