import { randomBytes } from "crypto";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { logMfaEvent } from "../../../common/mfaLogger";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Génère un secret TOTP aléatoire encodé en base32 (20 octets = 160 bits).
 */
function generateBase32Secret(byteLength = 20): string {
  const bytes = randomBytes(byteLength);
  let result = "";
  let bits = 0;
  let value = 0;

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Initie la configuration TOTP pour l'utilisateur connecté.
 * Génère un nouveau secret, le stocke temporairement (non activé)
 * et retourne le secret en clair et l'URL otpauth pour affichage en QR code.
 *
 * Si un setup précédent est incomplet (codes générés mais MFA non finalisée),
 * les codes orphelins sont supprimés pour repartir sur une base propre.
 */
const generateTotpSetupResolver: MutationResolvers["generateTotpSetup"] =
  async (_, __, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    const secret = generateBase32Secret();

    const issuer = "Trackdéchets";
    const label = encodeURIComponent(`${issuer}:${user.email}`);
    const qrCodeUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(
      issuer
    )}&algorithm=SHA1&digits=6&period=30`;

    // Stocke le nouveau secret et purge les éventuels codes d'un setup incomplet.
    // Un setup est incomplet quand totpActivatedAt est null mais que des TotpRecoveryCode
    // existent (confirmTotpSetup appelé sans finalizeMfaSetup ensuite).
    await prisma.$transaction([
      prisma.totpRecoveryCode.deleteMany({ where: { userId: user.id } }),
      prisma.user.update({
        where: { id: user.id },
        data: { totpSeed: secret }
      })
    ]);

    logMfaEvent({
      eventType: "MFA_SETUP_INITIATED",
      userId: user.id,
      success: true,
      ip: context.req.ip
    });

    return { secret, qrCodeUrl };
  };

export default generateTotpSetupResolver;
