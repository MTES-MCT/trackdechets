import { compare } from "bcrypt";
import { prisma } from "@td/prisma";

/**
 * Cherche un code de récupération valide (non utilisé) parmi les codes de
 * l'utilisateur. La comparaison est insensible à la casse et ignore les tirets.
 * Retourne l'id du TotpRecoveryCode correspondant, ou null si aucun ne correspond.
 */
export async function findValidRecoveryCode(
  userId: string,
  code: string
): Promise<string | null> {
  const normalized = code.replace(/-/g, "").toUpperCase();
  const recoveryCodes = await prisma.totpRecoveryCode.findMany({
    where: { userId, usedAt: null }
  });

  for (const rc of recoveryCodes) {
    if (await compare(normalized, rc.codeHash)) {
      return rc.id;
    }
  }
  return null;
}

/**
 * Compte les codes de récupération encore valides (non utilisés) d'un utilisateur.
 */
export async function countValidRecoveryCodes(userId: string): Promise<number> {
  return prisma.totpRecoveryCode.count({
    where: { userId, usedAt: null }
  });
}
