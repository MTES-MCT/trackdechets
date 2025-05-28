import { Strategy as PassportStrategy } from "passport-strategy";
import { Request } from "express";
import { TOTP } from "totp-generator";
import { prisma } from "@td/prisma";
import { sanitizeEmail } from "../utils";
import { User } from "@prisma/client";

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
   * @param req - The request object
   */
  async authenticate(req: Request): Promise<void> {
    // Extract credentials from request
    // This is where your custom authentication logic goes
    const { totp } = req.body;
    const userEmail = req.session?.preloggedUser?.userEmail;
    const expire = req.session?.preloggedUser?.expire;

    if (!expire || !userEmail) {
      return this.fail({ code: "TOTP_TIMEOUT_OR_MISSING_SESSION" }, 401);
    }

    if (new Date(expire) < new Date()) {
      // prelogging expired, user will be redirected to login
      delete req.session.preloggedUser;

      return this.fail({ code: "TOTP_TIMEOUT_OR_MISSING_SESSION" }, 401);
    }

    if (!totp) {
      return this.fail({ code: "MISSING_TOTP" }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { email: sanitizeEmail(userEmail) }
    });
    // Call verify function to validate the totp

    try {
      const verifiedUser = await this.verifyTotp(totp, user);
      if (!verifiedUser) {
        return this.fail({ code: "INVALID_TOTP" }, 401);
      }
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
