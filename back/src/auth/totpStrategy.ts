import { Strategy as PassportStrategy } from "passport-strategy";
import { Request } from "express";
import { TOTP } from "totp-generator";
import { prisma } from "@td/prisma";
import { sanitizeEmail } from "../utils";
import { User } from "@prisma/client";
import { addSeconds } from "date-fns";

const TOTP_LOCK_FACTOR = 5;

const increaseLock = async (user?: User) => {
  if (!user) {
    return null;
  }
  if (user.totpLockedUntil && user.totpLockedUntil > new Date()) {
    // ignore if user tries before lock expiration
    return null;
  }
  const totpFails = user.totpFails + 1;
  const totpLockedUntil = addSeconds(new Date(), totpFails * TOTP_LOCK_FACTOR);
  await prisma.user.update({
    where: { id: user.id },
    data: { totpFails, totpLockedUntil }
  });
  return totpLockedUntil;
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
   * This is the core method that Passport will call
   * when using this strategy
   *
   *  Lockout logic:
   *  - each time a wrong totp is submitted,
   *      - the `totpFails` count is increased
   *      - the `totpLockedUntil` is set to `totpFails` * 5 s  in the future
   *      - the lockout params is returned alongside the error code, allowing the UI to handle the response querytsring and inform the user
   *  - during lockout period, totp submission are ignored
   *  - once lockout expired, successful totp submission resets `totpFails` and `totpLockedUntil`
   *
   * @param req - The request object
   */
  async authenticate(req: Request): Promise<void> {
    // Extract credentials from request
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
      // prelogging expired, user will be redirected to login
      delete req.session.preloggedUser;
      await resetLock(user!);
      return this.fail({ code: "TOTP_TIMEOUT_OR_MISSING_SESSION" }, 401);
    }

    if (!totp) {
      return this.fail({ code: "MISSING_TOTP" }, 401);
    }

    if (user?.totpLockedUntil && user.totpLockedUntil > new Date()) {
      const lockout = user.totpLockedUntil.getTime();
      return this.fail({ code: `TOTP_LOCKOUT`, lockout }, 401);
    }

    // Call verify function to validate the totp
    try {
      const verifiedUser = await this.verifyTotp(totp, user);
      if (!verifiedUser) {
        // increase lockout time (fail * TOTP_LOCK_FACTOR seconds)
        const totpLockedUntil = await increaseLock(user!);
        const lockout = totpLockedUntil?.getTime();
        return this.fail({ code: "INVALID_TOTP", lockout }, 401);
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
