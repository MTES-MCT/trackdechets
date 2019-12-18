import { hash } from "bcrypt";
import { prisma, UserRole } from "../../generated/prisma-client";
import { ErrorCode, DomainError } from "../../common/errors";

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
    throw new DomainError(
      "Cet utilisateur a déjà été invité",
      ErrorCode.BAD_USER_INPUT
    );
  }

  const userAccoutHash = await hash(
    new Date().valueOf().toString() + Math.random().toString(),
    10
  );
  await prisma.createUserAccountHash({
    hash: userAccoutHash,
    email,
    role,
    companySiret: siret
  });
}
