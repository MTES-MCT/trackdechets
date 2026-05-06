import { compare } from "bcrypt";
import { TOTP } from "totp-generator";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";
import { sendMail } from "../../../mailer/mailing";
import { onTotpDisabled, renderMail } from "@td/mail";

function verifyTotpCode(seed: string, code: string): boolean {
  const { otp } = TOTP.generate(seed);
  const thirtySecondsAgo = Date.now() - 30 * 1000;
  const { otp: lastOtp } = TOTP.generate(seed, { timestamp: thirtySecondsAgo });
  return [otp, lastOtp].includes(code);
}

async function findValidRecoveryCode(
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
 * Désactive le TOTP sur le compte de l'utilisateur connecté.
 * Nécessite un code TOTP valide ou un code de récupération pour confirmer l'action.
 * Révoque le secret TOTP et invalide tous les codes de récupération.
 * Envoie un e-mail de notification de désactivation.
 * Les sessions actives sur d'autres appareils ne sont pas révoquées.
 */
const disableTotpResolver: MutationResolvers["disableTotp"] = async (
  _,
  { code },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id }
  });

  if (!dbUser.totpSeed || !dbUser.totpActivatedAt) {
    throw new UserInputError("Le TOTP n'est pas activé sur ce compte.");
  }

  const isTotpValid = verifyTotpCode(dbUser.totpSeed, code);
  const recoveryCodeId = isTotpValid
    ? null
    : await findValidRecoveryCode(dbUser.id, code);

  if (!isTotpValid && recoveryCodeId === null) {
    throw new UserInputError(
      "Le code est invalide. Vérifiez votre application d'authentification et réessayez."
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: dbUser.id },
      data: {
        totpSeed: null,
        totpActivatedAt: null,
        totpFails: 0,
        totpLockedUntil: null
      }
    }),
    prisma.totpRecoveryCode.deleteMany({ where: { userId: dbUser.id } })
  ]);

  await sendMail(
    renderMail(onTotpDisabled, {
      to: [{ name: dbUser.name, email: dbUser.email }],
      variables: { name: dbUser.name }
    })
  );

  const updatedUser = await prisma.user.findUniqueOrThrow({
    where: { id: dbUser.id }
  });

  return {
    ...updatedUser,
    // companies et featureFlags sont résolus par leurs field resolvers dédiés
    companies: [],
    featureFlags: [],
    totpEnabled: false
  };
};

export default disableTotpResolver;
