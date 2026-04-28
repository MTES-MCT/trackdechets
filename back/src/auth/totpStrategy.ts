import { Strategy as PassportStrategy } from "passport-strategy";
import { Request } from "express";
import { TOTP } from "totp-generator";
import { prisma, User } from "@td/prisma";
import { sanitizeEmail } from "../utils";
import { addSeconds } from "date-fns";

const TOTP_MAX_FAILS = 5;
const TOTP_LOCK_SECONDS = 300; // 5 minutes after TOTP_MAX_FAILS consecutive failures

const increaseLock = async (
  user: User
): Promise<{ totpFails: number; totpLockedUntil: Date | null }> => {
  const totpFails = user.totpFails + 1;
  const totpLockedUntil =
    totpFails >= TOTP_MAX_FAILS
      ? addSeconds(new Date(), TOTP_LOCK_SECONDS)
      : null;
  await prisma.user.update({
    where: { id: user.id },
    data: { totpFails, totpLockedUntil }
  });
  return { totpFails, totpLockedUntil };
};

const resetLock = async (user: User) => {
  await prisma.user.update({
    where: { id: user.id },
    data: { totpFails: 0, totpLockedUntil: null }
  });
};

/**
 * Custom Authentication Strategy for Passport.js
 */
export class TotpStrategy extends PassportStrategy {
  public name = "totp";

  /**
   * Authenticate request
   *
   * Lockout logic:
   *  - fails 1 to TOTP_MAX_FAILS-1: INVALID_TOTP, no lockout (user can retry immediately)
   *  - fail TOTP_MAX_FAILS (5th): TOTP_LOCKOUT, account blocked for TOTP_LOCK_SECONDS (5 min)
   *  - any attempt during active lockout: TOTP_LOCKOUT returned immediately
   *  - successful code after expired lockout: resets totpFails and totpLockedUntil
   */
  async authenticate(req: Request): Promise<void> {
    const { totp } = req.body;
    const userEmail = req.session?.preloggedUser?.userEmail;
    const expire = req.session?.preloggedUser?.expire;

    if (!expire || !userEmail) {
      return this.fail({ code: "TOTP_TIMEOUT_OR_MISSING_SESSION" }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { email: sanitizeEmail(userEmail) }
    });

    if (new Date(expire) < new Date()) {
      delete req.session.preloggedUser;
      await resetLock(user!);
      return this.fail({ code: "TOTP_TIMEOUT_OR_MISSING_SESSION" }, 401);
    }

    if (!totp) {
      return this.fail({ code: "MISSING_TOTP" }, 401);
    }

    if (user?.totpLockedUntil && user.totpLockedUntil > new Date()) {
      const lockout = user.totpLockedUntil.getTime();
      return this.fail({ code: "TOTP_LOCKOUT", lockout }, 401);
    }

    try {
      const verifiedUser = await this.verifyTotp(totp, user);
      if (!verifiedUser) {
        const { totpFails, totpLockedUntil } = await increaseLock(user!);
        if (totpFails >= TOTP_MAX_FAILS) {
          return this.fail(
            { code: "TOTP_LOCKOUT", lockout: totpLockedUntil!.getTime() },
            401
          );
        }
        return this.fail({ code: "INVALID_TOTP" }, 401);
      }
      await resetLock(user!);
      this.success(verifiedUser);
    } catch (err) {
      this.error(err);
    }
  }

  /**
   * Internal verify method
   *
   * @param totp - The input token to verify
   * @param user - The User instance
   * @returns A promise resolving to a user or null
   */
  private async verifyTotp(
    totp: string,
    user: User | null
  ): Promise<User | null> {
    if (!user) {
      return null;
    }
    const userSeed = user.totpSeed;
    if (!userSeed) {
      return null;
    }
    // generate current and last expired otp from user seed and compare to input code
    const { otp } = TOTP.generate(userSeed);

    const seconds = 30;
    const thirtySecondsAgo = Date.now() - seconds * 1000;
    const { otp: lastOtp } = TOTP.generate(userSeed, {
      timestamp: thirtySecondsAgo
    });

    // Compare to last top to handle small time drift on user authenticator
    if ([otp, lastOtp].includes(totp)) {
      return user;
    }
    return null;
  }
}

export default TotpStrategy;
