import { randomBytes } from "crypto";
import { hash } from "bcrypt";
import { TOTP } from "totp-generator";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";
import { sendMail } from "../../../mailer/mailing";
import { onTotpActivated, renderMail } from "@td/mail";

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Génère un code de récupération aléatoire au format XXXXX-XXXXX.
 * La saisie est insensible à la casse et le tiret est ignoré à la validation.
 */
function generateRecoveryCode(): string {
  const charsetLength = RECOVERY_CODE_CHARS.length;
  const maxUnbiased = Math.floor(256 / charsetLength) * charsetLength;
  const chars: string[] = [];

  while (chars.length < 10) {
    const bytes = randomBytes(10 - chars.length);
    for (const b of bytes) {
      if (b >= maxUnbiased) {
        continue;
      }
      chars.push(RECOVERY_CODE_CHARS[b % charsetLength]);
      if (chars.length === 10) {
        break;
      }
    }
  }

  const raw = chars.join("");
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
}

/**
 * Vérifie un code TOTP avec une tolérance de 30 secondes.
 */
function verifyTotpCode(seed: string, code: string): boolean {
  const { otp } = TOTP.generate(seed);
  const thirtySecondsAgo = Date.now() - 30 * 1000;
  const { otp: lastOtp } = TOTP.generate(seed, { timestamp: thirtySecondsAgo });
  return [otp, lastOtp].includes(code);
}

/**
 * Confirme la configuration TOTP en validant le premier code.
 * Active le TOTP, génère les codes de récupération et envoie un e-mail de confirmation.
 * Révoque les sessions actives sur les autres appareils via passwordUpdatedAt.
 */
const confirmTotpSetupResolver: MutationResolvers["confirmTotpSetup"] = async (
  _,
  { code },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id }
  });

  if (!dbUser.totpSeed) {
    throw new UserInputError(
      "Aucun secret TOTP en cours de configuration. Veuillez relancer la procédure."
    );
  }

  if (dbUser.totpActivatedAt) {
    throw new UserInputError("Le TOTP est déjà activé sur ce compte.");
  }

  if (!verifyTotpCode(dbUser.totpSeed, code)) {
    throw new UserInputError(
      "Le code est invalide. Vérifiez votre application d'authentification et réessayez."
    );
  }

  // Génération des codes de récupération
  const plainCodes = Array.from(
    { length: RECOVERY_CODE_COUNT },
    generateRecoveryCode
  );

  // Normalisation avant hachage : casse insensible, tiret ignoré
  const hashedCodes = await Promise.all(
    plainCodes.map(c =>
      hash(c.replace(/-/g, "").toUpperCase(), BCRYPT_SALT_ROUNDS)
    )
  );

  const now = new Date();

  await prisma.$transaction([
    // Activation du TOTP
    prisma.user.update({
      where: { id: dbUser.id },
      data: {
        totpActivatedAt: now,
        // Mise à jour de passwordUpdatedAt pour invalider les sessions des autres appareils
        passwordUpdatedAt: now
      }
    }),
    // Suppression de tout code de récupération existant
    prisma.totpRecoveryCode.deleteMany({ where: { userId: dbUser.id } }),
    // Stockage des codes hachés
    ...hashedCodes.map(codeHash =>
      prisma.totpRecoveryCode.create({
        data: { userId: dbUser.id, codeHash }
      })
    )
  ]);

  // Mise à jour de issuedAt pour garder la session courante valide
  context.req.session.issuedAt = new Date().toISOString();

  // E-mail de confirmation
  await sendMail(
    renderMail(onTotpActivated, {
      to: [{ name: dbUser.name, email: dbUser.email }]
    })
  );

  return { codes: plainCodes };
};

export default confirmTotpSetupResolver;
