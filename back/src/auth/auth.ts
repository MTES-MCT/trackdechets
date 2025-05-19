import {
  AccessToken,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  User as PrismaUser,
  User
} from "@prisma/client";
import { compare } from "bcrypt";
import express from "express";
import passport from "passport";
import { BasicStrategy } from "passport-http";
import { Strategy as BearerStrategy } from "passport-http-bearer";
import { addMinutes } from "date-fns";
import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as ClientPasswordStrategy,
  VerifyFunction
} from "passport-oauth2-client-password";
import { prisma } from "@td/prisma";
import { GraphQLContext } from "../types";
import {
  daysBetween,
  sameDayMidnight,
  sanitizeEmail,
  hashToken
} from "../utils";
import {
  setUserLoginFailed,
  clearUserLoginNeedsCaptcha,
  doesUserLoginNeedsCaptcha
} from "../common/redis/captcha";
import { checkCaptcha } from "../captcha/captchaGen";

import { TotpStrategy } from "./totpStrategy";

// Set specific type for req.user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends PrismaUser {
      auth: AuthType;
      ip?: string;
    }
  }
}

export enum AuthType {
  Session = "SESSION",
  Bearer = "BEARER"
}

enum LoginErrorCode {
  INVALID_USER_OR_PASSWORD = "INVALID_USER_OR_PASSWORD",
  NOT_ACTIVATED = "NOT_ACTIVATED",
  INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA = "INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA",
  INVALID_CAPTCHA = "INVALID_CAPTCHA",
  TOTP_TIMEOUT_OR_MISSING_SESSION = "TOTP_TIMEOUT_OR_MISSING_SESSION",
  MISSING_TOTP = "MISSING_TOTP",
  INVALID_TOTP = "INVALID_TOTP"
}

// verbose error message and related errored field
export const getLoginError = (username: string) => ({
  INVALID_USER_OR_PASSWORD: {
    code: LoginErrorCode.INVALID_USER_OR_PASSWORD,
    message: "Email ou mot de passe incorrect",
    username: username
  },
  INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA: {
    code: LoginErrorCode.INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA,
    message: "Email ou mot de passe incorrect",
    username: username
  },
  INVALID_CAPTCHA: {
    code: LoginErrorCode.INVALID_CAPTCHA,
    message: "Le test anti robots est incorrect",
    username: username
  },
  NOT_ACTIVATED: {
    code: LoginErrorCode.NOT_ACTIVATED,
    message:
      "Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support",
    username: username
  },
  INVALID_TOTP: {
    code: LoginErrorCode.INVALID_TOTP,
    message: "Code d'authentification invalide"
  },
  MISSING_TOTP: {
    code: LoginErrorCode.MISSING_TOTP,
    message: "Code d'authentification manquant"
  }
});

// apart from logging the user in, we perform captcha verifications:
// - if user has performed less than FAILED_ATTEMPTS_BEFORE_CAPTCHA in the last FAILED_LOGIN_EXPIRATION seconds, perform as usual
// - if user has performed more failed attempts, check if captcha is correct
// - if captcha is missing or incorrect, return appropriate error message
passport.use(
  new LocalStrategy(
    { usernameField: "email", passReqToCallback: true },
    async (req, username, password, done) => {
      const needsCaptcha = await doesUserLoginNeedsCaptcha(
        sanitizeEmail(username)
      );

      if (needsCaptcha) {
        if (!req.body?.captchaInput) {
          await setUserLoginFailed(username);
          return done(null, false, {
            ...getLoginError(username).INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA
          });
        }

        const captchaIsValid = await checkCaptcha(
          req.body?.captchaInput,
          req.body?.captchaToken
        );

        if (!captchaIsValid) {
          await setUserLoginFailed(username);
          return done(null, false, {
            ...getLoginError(username).INVALID_CAPTCHA
          });
        }
      }

      const user = await prisma.user.findUnique({
        where: { email: sanitizeEmail(username) }
      });

      if (!user) {
        return done(null, false, {
          ...getLoginError(username).INVALID_USER_OR_PASSWORD
        });
      }

      if (!user.isActive) {
        return done(null, false, {
          ...getLoginError(username).NOT_ACTIVATED
        });
      }

      const needsTotp = !!user.totpActivatedAt && !!user.totpSeed;

      const passwordValid = await compare(password, user.password);

      if (passwordValid) {
        await clearUserLoginNeedsCaptcha(user.email);

        if (needsTotp) {
          // we redirect to the totp page without logging the user in.
          // We store their email in a short-lived session to be retrieved on the 2nd factor page
          req.session.preloggedUser = {
            userEmail: user.email,
            expire: addMinutes(new Date(), 5)
          };

          return done(null, false, { message: "" });
        }
        return done(null, { ...user, auth: AuthType.Session });
      }

      // if password is not valid and user is not admin, set a redis count to require captcha after several failed login attemps
      await setUserLoginFailed(username);

      // adds INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA if needsCaptcha to trigger captcha field display on the front
      return done(null, false, {
        ...getLoginError(username).INVALID_USER_OR_PASSWORD,
        ...(needsCaptcha
          ? getLoginError(username).INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA
          : {})
      });
    }
  )
);

passport.use(new TotpStrategy());

passport.serializeUser((user: User, done) => {
  // Store user id in session
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  // Fetch the complete user from database using their ID
  prisma.user
    .findUniqueOrThrow({ where: { id } })
    .then(user => done(null, { ...user, auth: AuthType.Session }))
    .catch(err => done(err));
});

/**
 * Update field lastUsed on AccessToken if it was never set
 * or if it was set more than one day ago
 * @param accessToken
 */
export function updateAccessTokenLastUsed(
  accessToken: Pick<AccessToken, "lastUsed" | "token">
) {
  // use new Date(Date.now()) instead of new Date()
  // in order to mock Date.now in unit test auth.test.ts
  const now = new Date(Date.now());
  if (
    !accessToken.lastUsed ||
    daysBetween(now, new Date(accessToken.lastUsed)) > 0
  ) {
    return prisma.accessToken.update({
      data: { lastUsed: sameDayMidnight(now) },
      where: { token: accessToken.token }
    });
  } else {
    return Promise.resolve();
  }
}

passport.use(
  new BearerStrategy(async (token, done) => {
    try {
      const accessToken = await prisma.accessToken.findFirst({
        where: {
          token: hashToken(token)
        },
        select: {
          isRevoked: true,
          lastUsed: true,
          token: true,
          user: true
        }
      });
      if (accessToken && !accessToken.isRevoked) {
        const user = accessToken.user;
        await updateAccessTokenLastUsed(accessToken);
        return done(null, { ...user, auth: AuthType.Bearer });
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients. They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens. The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate. Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header). While this approach is not recommended by
 * the specification, in practice it is quite common.
 */

const verifyClient: VerifyFunction = async (clientId, clientSecret, done) => {
  const application = await prisma.application.findUnique({
    where: { id: clientId }
  });
  if (!application) {
    return done(null, false);
  }
  if (application.clientSecret !== clientSecret) {
    return done(null, false);
  }
  return done(null, application);
};

passport.use(new BasicStrategy(verifyClient));

passport.use(new ClientPasswordStrategy(verifyClient));

/**
 * Custom passport callback that pass to next middleware
 * even if authorization fails (default behavior is to return
 * 401 Not Authorized). Fine grained control of authorization
 * will be handled in resolvers
 */
async function passportCallback(
  err: Error,
  req: express.Request,
  next: express.NextFunction,
  user: Express.User,
  callback?: () => Promise<any>
) {
  if (user) {
    req.logIn(user, { session: false }, () => undefined);
    if (callback) {
      await callback();
    }
  }
  next(err);
}

/**
 * Decorator function used to apply a middleware
 * only if the user not already authenticated
 */
const iffNotAuthenticated = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
  fn: express.RequestHandler
) => {
  if (!req.isAuthenticated()) {
    fn(req, res, next);
  } else {
    next();
  }
};

/**
 * Middleware used to authenticate request using OAuth
 * bearer token.
 */
export const passportBearerMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  iffNotAuthenticated(
    req,
    res,
    next,
    passport.authenticate("bearer", { session: false }, (err, user) => {
      passportCallback(err, req, next, user);
    })
  );
};

/**
 * Passport will use all possible strategies to authenticate user on the GraphQL endpoint
 * Nevertheless we may want to apply only specific strategies on a particular GraphQL query.
 * For example the mutation used to renew a user password may only be accessible from a user
 * logged in from Trackdechets UI. This helper function allow to get rid of user info if
 * it was not authenticated with the proper stratgey
 */
export function applyAuthStrategies(
  context: GraphQLContext,
  strategies: AuthType[]
) {
  if (context.user && !strategies.includes(context.user.auth!)) {
    context.user = null;
  }
  return context;
}

/**
 * Check if request is made by a logged-in Trackdechets UI user
 *
 */
export function isSessionUser(context: GraphQLContext): boolean {
  return !!context.user && context.user.auth === AuthType.Session;
}
