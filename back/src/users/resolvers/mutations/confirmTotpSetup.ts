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
import { logMfaEvent } from "../../../common/mfaLogger";

const RECOVERY_CODE_COUNT = 5;
const RECOVERY_CODE_LENGTH = 20;
const RECOVERY_CODE_GROUP_SIZE = 5;
const RECOVERY_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Génère un code de récupération aléatoire au format XXXXX-XXXXX-XXXXX-XXXXX.
 * La saisie est insensible à la casse et les tirets sont ignorés à la validation.
 */
function generateRecoveryCode(): string {
  const charsetLength = RECOVERY_CODE_CHARS.length;
  const maxUnbiased = Math.floor(256 / charsetLength) * charsetLength;
  const chars: string[] = [];

  while (chars.length < RECOVERY_CODE_LENGTH) {
    const bytes = randomBytes(RECOVERY_CODE_LENGTH - chars.length);
    for (const b of bytes) {
      if (b >= maxUnbiased) {
        continue;
      }
      chars.push(RECOVERY_CODE_CHARS[b % charsetLength]);
      if (chars.length === RECOVERY_CODE_LENGTH) {
        break;
      }
    }
  }

  const raw = chars.join("");
  const groups: string[] = [];
  for (let i = 0; i < raw.length; i += RECOVERY_CODE_GROUP_SIZE) {
    groups.push(raw.slice(i, i + RECOVERY_CODE_GROUP_SIZE));
  }
  return groups.join("-");
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
 * Valide le code TOTP et génère les codes de récupération.
 * N'active PAS encore la MFA — l'activation définitive est faite par finalizeMfaSetup
 * une fois que l'utilisateur a confirmé avoir sauvegardé ses codes.
 *
 * État après cet appel : totpSeed set, totpActivatedAt null, TotpRecoveryCodes créés.
 * Cet état est considéré comme un setup incomplet : il sera nettoyé si l'utilisateur
 * relance le parcours (generateTotpSetup) sans avoir finalisé.
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
    logMfaEvent({
      eventType: "MFA_ACTIVATION_ABANDONED",
      userId: dbUser.id,
      success: false,
      ip: context.req.ip
    });
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

  // Stockage des codes — on remplace tout setup précédent incomplet
  await prisma.$transaction([
    prisma.totpRecoveryCode.deleteMany({ where: { userId: dbUser.id } }),
    ...hashedCodes.map(codeHash =>
      prisma.totpRecoveryCode.create({
        data: { userId: dbUser.id, codeHash }
      })
    )
  ]);

  // Mise à jour de issuedAt pour garder la session courante valide
  context.req.session.issuedAt = new Date().toISOString();

  logMfaEvent({
    eventType: "MFA_ACTIVATED",
    userId: dbUser.id,
    success: true,
    ip: context.req.ip
  });

  // E-mail de confirmation
  await sendMail(
    renderMail(onTotpActivated, {
      to: [{ name: dbUser.name, email: dbUser.email }]
    })
  );

  return { codes: plainCodes };
};

export default confirmTotpSetupResolver;
