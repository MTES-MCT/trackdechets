import { prisma, MfaResetRequestStatus } from "@td/prisma";
import { logger } from "@td/logger";
import { promisify } from "util";
import crypto from "crypto";
import { addHours } from "date-fns";
import { onMfaResetDone, renderMail } from "@td/mail";
import { sendMail } from "../../../mailer/mailing";

const MFA_RECONFIG_TOKEN_EXPIRY_HOURS = 24;
const { UI_HOST } = process.env;

/**
 * Traite les demandes de réinitialisation MFA dont l'échéance (dueAt) est passée.
 *
 * Pour chaque demande PENDING avec dueAt <= now :
 *  - Vérifie que le compte existe et est actif → FAILED sinon
 *  - Révoque le secret TOTP (totpSeed = null, totpActivatedAt = null)
 *  - Invalide les codes de récupération (deleteMany)
 *  - Met mustReconfigureMfa = true (continuité TRA-17933)
 *  - Lève la suspension mfaResetSuspended = false
 *  - Passe la demande en DONE
 *
 * Appelée par le scheduler externe (cron quotidien recommandé, fréquence ≤ 1h).
 */
export async function processDueMfaResetRequests(): Promise<void> {
  const now = new Date();

  const duePendingRequests = await prisma.mfaResetRequest.findMany({
    where: {
      status: MfaResetRequestStatus.PENDING,
      dueAt: { lte: now }
    },
    include: { user: true }
  });

  if (duePendingRequests.length === 0) {
    return;
  }

  logger.info(
    `[processDueMfaResetRequests] ${duePendingRequests.length} demande(s) à traiter.`
  );

  for (const request of duePendingRequests) {
    try {
      const user = request.user;

      // Compte supprimé ou désactivé entre la création et l'échéance
      if (!user || !user.isActive) {
        await prisma.mfaResetRequest.update({
          where: { id: request.id },
          data: {
            status: MfaResetRequestStatus.FAILED,
            note: buildFailedNote(
              request.note,
              "Compte introuvable ou désactivé au moment de la réinitialisation."
            )
          }
        });

        // Levée de suspension uniquement si le compte existe encore
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { mfaResetSuspended: false }
          });
        }

        logger.warn(
          `[processDueMfaResetRequests] Demande ${request.id} : compte ${request.userId} introuvable ou désactivé → FAILED`
        );
        continue;
      }

      // Réinitialisation atomique : révocation TOTP + recovery codes + flags
      await prisma.$transaction(async tx => {
        await tx.totpRecoveryCode.deleteMany({ where: { userId: user.id } });

        await tx.user.update({
          where: { id: user.id },
          data: {
            totpSeed: null,
            totpActivatedAt: null,
            totpFails: 0,
            totpLockedUntil: null,
            recoveryFails: 0,
            recoveryLockedUntil: null,
            mustReconfigureMfa: true,
            mfaResetSuspended: false
          }
        });

        await tx.mfaResetRequest.update({
          where: { id: request.id },
          data: { status: MfaResetRequestStatus.DONE }
        });
      });

      logger.info(
        `[processDueMfaResetRequests] Demande ${request.id} traitée → DONE (utilisateur ${user.email})`
      );

      // E-mail 5 : lien sécurisé de reconfiguration MFA (non bloquant)
      sendMfaResetDoneEmail({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive ?? false
      }).catch(err =>
        logger.error(
          `[processDueMfaResetRequests] Erreur envoi email 5 pour demande ${request.id}`,
          err
        )
      );
    } catch (err) {
      logger.error(
        `[processDueMfaResetRequests] Erreur lors du traitement de la demande ${request.id}`,
        err
      );

      // Passe en FAILED avec note d'erreur technique
      try {
        await prisma.mfaResetRequest.update({
          where: { id: request.id },
          data: {
            status: MfaResetRequestStatus.FAILED,
            note: buildFailedNote(
              request.note,
              `Erreur technique lors de la réinitialisation : ${
                err instanceof Error ? err.message : String(err)
              }`
            )
          }
        });
      } catch (updateErr) {
        // Si même la mise à jour en FAILED échoue, on loggue uniquement
        logger.error(
          `[processDueMfaResetRequests] Impossible de passer la demande ${request.id} en FAILED`,
          updateErr
        );
      }
      // TODO: Si un système d'alerte support existe (ex: Sentry alert, PagerDuty),
      // l'intégrer ici pour notifier l'équipe ops d'une erreur non récupérée.
    }
  }
}

async function sendMfaResetDoneEmail(user: {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}): Promise<void> {
  const randomBytes = promisify(crypto.randomBytes);
  const token = (await randomBytes(32)).toString("hex");
  const tokenExpires = addHours(new Date(), MFA_RECONFIG_TOKEN_EXPIRY_HOURS);

  await prisma.mfaReconfigToken.create({
    data: {
      token,
      tokenExpires,
      user: { connect: { id: user.id } }
    }
  });

  const reconfigurationUrl = `https://${UI_HOST}/mfa-reconfiguration?token=${encodeURIComponent(
    token
  )}`;

  await sendMail(
    renderMail(onMfaResetDone, {
      to: [{ name: user.name, email: user.email }],
      variables: {
        name: user.name,
        email: user.email,
        reconfigurationUrl
      }
    })
  );
}

function buildFailedNote(
  existingNote: string | null | undefined,
  errorMessage: string
): string {
  const parts: string[] = [];
  if (existingNote) parts.push(existingNote);
  parts.push(`[ÉCHEC AUTOMATIQUE] ${errorMessage}`);
  return parts.join("\n---\n");
}
