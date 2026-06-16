import { MfaResetRequest, User, UserRole } from "@td/prisma";
import { prisma } from "@td/prisma";
import { UserInputError } from "../../../../common/errors";
import { sanitizeEmail } from "../../../../utils";
import { MfaResetRequestStatus } from "@td/prisma";

/**
 * Vérifie que le compte visé existe, est actif, et a une MFA active.
 * Retourne l'utilisateur si toutes les conditions sont réunies.
 */
export async function findTargetUserOrThrow(email: string): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { email: sanitizeEmail(email) }
  });

  if (!user) {
    throw new UserInputError("Aucun compte trouvé pour cet email.");
  }

  if (!user.isActive) {
    throw new UserInputError("Ce compte est désactivé.");
  }

  if (!user.totpSeed || !user.totpActivatedAt) {
    throw new UserInputError(
      "Ce compte n'a pas de double authentification (MFA) active. La réinitialisation n'est pas applicable."
    );
  }

  return user;
}

/**
 * Vérifie qu'aucune demande PENDING n'existe déjà pour cet utilisateur.
 * À appeler avant l'écriture dans la transaction.
 */
export async function assertNoPendingRequest(userId: string): Promise<void> {
  const existing = await prisma.mfaResetRequest.findFirst({
    where: { userId, status: MfaResetRequestStatus.PENDING }
  });

  if (existing) {
    throw new UserInputError(
      "Une demande de réinitialisation MFA est déjà en cours pour ce compte."
    );
  }
}

/**
 * Compte les administrateurs uniques rattachés aux établissements de l'utilisateur.
 * Exclut l'utilisateur lui-même pour ne compter que les tiers notifiables.
 */
export async function countNotifiableAdmins(userId: string): Promise<number> {
  const associations = await prisma.companyAssociation.findMany({
    where: { userId },
    select: { companyId: true }
  });

  if (associations.length === 0) {
    return 0;
  }

  const companyIds = associations.map(a => a.companyId);

  const adminAssociations = await prisma.companyAssociation.findMany({
    where: {
      companyId: { in: companyIds },
      role: UserRole.ADMIN,
      userId: { not: userId }
    },
    select: { userId: true },
    distinct: ["userId"]
  });

  return adminAssociations.length;
}

export interface MfaResetRequestWithUser extends MfaResetRequest {
  user: User;
}

/**
 * Retourne la demande avec l'utilisateur inclus, ou lance une erreur.
 */
export async function getMfaResetRequestOrThrow(
  id: string
): Promise<MfaResetRequestWithUser> {
  const request = await prisma.mfaResetRequest.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!request) {
    throw new UserInputError(
      "Cette demande de réinitialisation MFA n'existe pas."
    );
  }

  return request as MfaResetRequestWithUser;
}
