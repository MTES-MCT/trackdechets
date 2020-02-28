import { hash } from "bcrypt";
import { prisma, UserRole } from "../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";

/**
 * Create a temporary association between an email and
 * a siret
 * @param email
 * @param role
 * @param siret
 */
export async function createUserAccountHash(
  email: string,
  role: UserRole,
  siret: string
) {
  // check for existing records
  const existingHashes = await prisma.userAccountHashes({
    where: { email, companySiret: siret }
  });

  if (existingHashes && existingHashes.length > 0) {
    throw new UserInputError("Cet utilisateur a déjà été invité", {
      invalidArgs: ["email"]
    });
  }

  const userAccoutHash = await hash(
    new Date().valueOf().toString() + Math.random().toString(),
    10
  );
  return prisma.createUserAccountHash({
    hash: userAccoutHash,
    email,
    role,
    companySiret: siret
  });
}
