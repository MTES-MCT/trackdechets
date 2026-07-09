import { Request, Response, NextFunction } from "express";
import { prisma, User } from "@td/prisma";
import { addSeconds } from "date-fns";
import { sanitizeEmail, getUIBaseURL } from "../utils";
import { getSafeReturnTo } from "../common/helpers";
import {
  findValidRecoveryCode,
  countValidRecoveryCodes
} from "../users/services/recoveryCode.service";
import { AuthType } from "./auth";
import { logMfaEvent } from "../common/mfaLogger";

const UI_BASE_URL = getUIBaseURL();
const RECOVERY_MAX_FAILS = 3;
const RECOVERY_LOCK_SECONDS = 3600; // 1h

type RecoveryAction = "RESET" | "TEMPORARY";

function parseRecoveryAction(raw: unknown): RecoveryAction {
  return raw === "TEMPORARY" ? "TEMPORARY" : "RESET";
}

async function increaseRecoveryLock(
  user: User
): Promise<{ recoveryFails: number; recoveryLockedUntil: Date | null }> {
  const recoveryFails = user.recoveryFails + 1;
  const recoveryLockedUntil =
    recoveryFails >= RECOVERY_MAX_FAILS
      ? addSeconds(new Date(), RECOVERY_LOCK_SECONDS)
      : null;
  await prisma.user.update({
    where: { id: user.id },
    data: { recoveryFails, recoveryLockedUntil }
  });
  return { recoveryFails, recoveryLockedUntil };
}

/**
 * Handler POST /recovery-login
 *
 * Valide un code de récupération soumis depuis la modale "Je n'ai pas accès à
 * l'application". Requiert une session preloggedUser valide (même prérequis que /otp).
 *
 * Deux comportements possibles selon `recoveryAction` :
 *  - RESET : tous les codes de récupération sont invalidés, le secret TOTP est
 *    révoqué, mustReconfigureMfa est mis à true, l'utilisateur est connecté.
 *  - TEMPORARY : seul le code soumis est consommé. S'il reste au moins un
 *    autre code valide, l'utilisateur est connecté normalement (TOTP et
 *    autres codes intacts). Si c'était le dernier code valide, le comportement
 *    retombe sur RESET.
 *
 * Lockout : RECOVERY_MAX_FAILS (3) tentatives invalides → blocage RECOVERY_LOCK_SECONDS (1h)
 */
export async function recoveryLoginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { recoveryCode } = req.body;
    const recoveryAction = parseRecoveryAction(req.body.recoveryAction);
    const returnTo = getSafeReturnTo(req.body.returnTo, UI_BASE_URL);

    const userEmail = req.session?.preloggedUser?.userEmail;
    const expire = req.session?.preloggedUser?.expire;

    // Session preloggedUser absente ou expirée
    if (!userEmail || !expire || new Date(expire) < new Date()) {
      delete req.session?.preloggedUser;
      res.redirect(
        `${UI_BASE_URL}/login?errorCode=TOTP_TIMEOUT_OR_MISSING_SESSION`
      );
      return;
    }

    if (!recoveryCode || typeof recoveryCode !== "string") {
      res.redirect(
        `${UI_BASE_URL}/second-factor?errorCode=MISSING_RECOVERY_CODE`
      );
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: sanitizeEmail(userEmail) }
    });

    if (!user) {
      res.redirect(
        `${UI_BASE_URL}/login?errorCode=TOTP_TIMEOUT_OR_MISSING_SESSION`
      );
      return;
    }

    // Blocage actif
    if (user.recoveryLockedUntil && user.recoveryLockedUntil > new Date()) {
      const lockout = user.recoveryLockedUntil.getTime();
      res.redirect(
        `${UI_BASE_URL}/second-factor?errorCode=RECOVERY_LOCKOUT&lockout=${lockout}`
      );
      return;
    }

    // Validation du code de récupération
    const recoveryCodeId = await findValidRecoveryCode(user.id, recoveryCode);

    if (!recoveryCodeId) {
      const { recoveryFails, recoveryLockedUntil } = await increaseRecoveryLock(
        user
      );

      if (recoveryFails >= RECOVERY_MAX_FAILS) {
        logMfaEvent({
          eventType: "MFA_RECOVERY_LOCKOUT_TRIGGERED",
          userId: user.id,
          success: false,
          ip: req.ip
        });
        res.redirect(
          `${UI_BASE_URL}/second-factor?errorCode=RECOVERY_LOCKOUT&lockout=${recoveryLockedUntil!.getTime()}`
        );
      } else {
        const attemptsRemaining = RECOVERY_MAX_FAILS - recoveryFails;
        logMfaEvent({
          eventType: "MFA_RECOVERY_FAILURE",
          userId: user.id,
          success: false,
          ip: req.ip
        });
        res.redirect(
          `${UI_BASE_URL}/second-factor?errorCode=INVALID_RECOVERY_CODE&attemptsRemaining=${attemptsRemaining}`
        );
      }
      return;
    }

    // Capture avant la transaction (qui remet recoveryLockedUntil à null)
    const wasLocked = !!user.recoveryLockedUntil;

    // Détermine si, en mode TEMPORARY, il restera au moins un autre code valide
    const remainingOtherCodes =
      recoveryAction === "TEMPORARY"
        ? (await countValidRecoveryCodes(user.id)) - 1
        : 0;
    const shouldResetMfa =
      recoveryAction === "RESET" || remainingOtherCodes <= 0;

    if (shouldResetMfa) {
      // Révocation complète TOTP + activation flag reconfiguration
      await prisma.$transaction([
        // Invalide tous les codes (y compris le code utilisé — pas d'audit trail nécessaire)
        prisma.totpRecoveryCode.deleteMany({ where: { userId: user.id } }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            totpSeed: null,
            totpActivatedAt: null,
            totpFails: 0,
            totpLockedUntil: null,
            recoveryFails: 0,
            recoveryLockedUntil: null,
            mustReconfigureMfa: true
          }
        })
      ]);

      if (recoveryAction === "TEMPORARY") {
        logMfaEvent({
          eventType: "MFA_RECOVERY_LAST_CODE_USED",
          userId: user.id,
          success: true,
          ip: req.ip
        });
      }
    } else {
      // Connexion temporaire unique : seul le code soumis est consommé
      await prisma.$transaction([
        prisma.totpRecoveryCode.update({
          where: { id: recoveryCodeId },
          data: { usedAt: new Date() }
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            recoveryFails: 0,
            recoveryLockedUntil: null
          }
        })
      ]);

      logMfaEvent({
        eventType: "MFA_RECOVERY_TEMP_LOGIN_SUCCESS",
        userId: user.id,
        success: true,
        ip: req.ip
      });
    }

    if (wasLocked) {
      logMfaEvent({
        eventType: "MFA_RECOVERY_LOCKOUT_LIFTED",
        userId: user.id,
        success: true,
        ip: req.ip
      });
    }
    logMfaEvent({
      eventType: "MFA_RECOVERY_SUCCESS",
      userId: user.id,
      success: true,
      ip: req.ip
    });

    req.session.regenerate(regenerateErr => {
      if (regenerateErr) {
        return next(regenerateErr);
      }
      req.logIn({ ...user, auth: AuthType.Session }, loginErr => {
        if (loginErr) {
          return next(loginErr);
        }
        req.session.issuedAt = new Date().toISOString();
        res.redirect(`${UI_BASE_URL}${returnTo}`);
      });
    });
  } catch (err) {
    next(err);
  }
}
