import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { UserInputError } from "../../../common/errors";
import { sendMail } from "../../../mailer/mailing";
import { onTotpActivated, onTotpRecovery, renderMail } from "@td/mail";
import { logMfaEvent } from "../../../common/mfaLogger";

/**
 * Finalise l'activation MFA après que l'utilisateur a confirmé avoir sauvegardé
 * ses codes de récupération.
 *
 * Pré-requis (setup complet) : totpSeed présent, totpActivatedAt null,
 * et des TotpRecoveryCodes existent (générés par confirmTotpSetup).
 *
 * C'est ici que la MFA devient réellement active : totpActivatedAt est posé,
 * les sessions sur les autres appareils sont révoquées via passwordUpdatedAt.
 */
const finalizeMfaSetupResolver: MutationResolvers["finalizeMfaSetup"] = async (
  _,
  __,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: { totpRecoveryCodes: { take: 1 } }
  });

  if (dbUser.totpActivatedAt) {
    throw new UserInputError("Le TOTP est déjà activé sur ce compte.");
  }

  // Le setup est considéré complet si confirmTotpSetup a été appelé avec succès :
  // totpSeed présent + au moins un TotpRecoveryCode créé.
  if (!dbUser.totpSeed || dbUser.totpRecoveryCodes.length === 0) {
    throw new UserInputError(
      "Le parcours de configuration TOTP n'est pas complet. Veuillez valider votre code TOTP d'abord."
    );
  }

  // Capture avant toute mise à jour : garantit que la valeur n'est pas écrasée
  // si l'update venait à inclure mustReconfigureMfa dans le futur.
  const isRecoveryReconfiguration = dbUser.mustReconfigureMfa === true;

  const now = new Date();

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      totpActivatedAt: now,
      // Révocation des sessions actives sur les autres appareils
      passwordUpdatedAt: now
    }
  });

  // Mise à jour de issuedAt pour garder la session courante valide
  context.req.session.issuedAt = new Date().toISOString();

  if (isRecoveryReconfiguration) {
    logMfaEvent({
      eventType: "MFA_RECONFIG_COMPLETED",
      userId: dbUser.id,
      success: true,
      ip: context.req.ip
    });
    await sendMail(
      renderMail(onTotpRecovery, {
        to: [{ name: dbUser.name, email: dbUser.email }],
        variables: { name: dbUser.name }
      })
    );
  } else {
    await sendMail(
      renderMail(onTotpActivated, {
        to: [{ name: dbUser.name, email: dbUser.email }]
      })
    );
  }

  return true;
};

export default finalizeMfaSetupResolver;
