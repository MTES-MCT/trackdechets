import { Request, Response, NextFunction } from "express";
import { prisma, User } from "@td/prisma";
import { addSeconds } from "date-fns";
import { sanitizeEmail, getUIBaseURL } from "../utils";
import { getSafeReturnTo } from "../common/helpers";
import { findValidRecoveryCode } from "../users/services/recoveryCode.service";
import { AuthType } from "./auth";

const UI_BASE_URL = getUIBaseURL();
const RECOVERY_MAX_FAILS = 3;
const RECOVERY_LOCK_SECONDS = 300; // 5 minutes, cohérent avec le lockout TOTP

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
 * En cas de succès :
 *  - tous les codes de récupération de l'utilisateur sont invalidés
 *  - le secret TOTP est révoqué
 *  - mustReconfigureMfa est mis à true
 *  - l'utilisateur est connecté
 *  - l'email de récupération est envoyé en fin de reconfiguration (finalizeMfaSetup)
 *
 * Lockout : RECOVERY_MAX_FAILS (3) tentatives invalides → blocage RECOVERY_LOCK_SECONDS (300s)
 */
export async function recoveryLoginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { recoveryCode } = req.body;
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
        res.redirect(
          `${UI_BASE_URL}/second-factor?errorCode=RECOVERY_LOCKOUT&lockout=${recoveryLockedUntil!.getTime()}`
        );
      } else {
        res.redirect(
          `${UI_BASE_URL}/second-factor?errorCode=INVALID_RECOVERY_CODE`
        );
      }
      return;
    }

    // Code valide : révocation complète TOTP + activation flag reconfiguration
    await prisma.$transaction([
      // Invalide tous les codes (y compris le code utilisé — pas d'audit trail nécessaire)
      prisma.totpRecoveryCode.deleteMany({ where: { userId: user.id } }),
      // Révoque le TOTP, remet les compteurs à zéro, active la reconfiguration forcée
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
