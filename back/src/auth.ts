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

import { Strategy as LocalStrategy } from "passport-local";
import {
  Strategy as ClientPasswordStrategy,
  VerifyFunction
} from "passport-oauth2-client-password";
import prisma from "./prisma";
import { GraphQLContext } from "./types";
import {
  daysBetween,
  sameDayMidnight,
  sanitizeEmail,
  hashToken
} from "./utils";

// Set specific type for req.user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends PrismaUser {
      auth?: AuthType;
    }
  }
}

export enum AuthType {
  Session = "SESSION",
  JWT = "JWT",
  Bearer = "BEARER"
}

enum LoginErrorCode {
  INVALID_USER_OR_PASSWORD = "INVALID_USER_OR_PASSWORD",
  NOT_ACTIVATED = "NOT_ACTIVATED"
}

// verbose error message and related errored field
export const getLoginError = (username: string) => ({
  INVALID_USER_OR_PASSWORD: {
    code: LoginErrorCode.INVALID_USER_OR_PASSWORD,
    message: "Email ou mot de passe incorrect",
    username: username
  },
  NOT_ACTIVATED: {
    code: LoginErrorCode.NOT_ACTIVATED,
    message:
      "Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support",
    username: username
  }
});

export const ADMIN_IS_PERSONIFYING = "ADMIN_IS_PERSONIFYING";

passport.use(
  new LocalStrategy(
    { usernameField: "email", passReqToCallback: true },
    async (req, username, password, done) => {
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

      const passwordValid = await compare(password, user.password);
      if (passwordValid) {
        return done(null, user);
      }

      if (req.user?.isAdmin) {
        return done(null, user, { message: ADMIN_IS_PERSONIFYING });
      }

      return done(null, false, {
        ...getLoginError(username).INVALID_USER_OR_PASSWORD
      });
    }
  )
);

passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  prisma.user
    .findUnique({ where: { id } })
    .then(user => done(null, { ...user, auth: AuthType.Session }))
    .catch(err => done(err));
});

/**
 * Update field lastUsed on AccessToken if it was never set
 * or if it was set more than one day ago
 * @param accessToken
 */
export function updateAccessTokenLastUsed(accessToken: AccessToken) {
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
        include: { user: true }
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
    req.logIn(user, { session: false }, null);
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
  if (context.user && !strategies.includes(context.user.auth)) {
    context.user = null;
  }
  return context;
}
