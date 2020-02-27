import * as passport from "passport";
import * as express from "express";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as BearerStrategy } from "passport-http-bearer";
import { Strategy as LocalStrategy } from "passport-local";
import { BasicStrategy } from "passport-http";
import {
  Strategy as ClientPasswordStrategy,
  VerifyFunction
} from "passport-oauth2-client-password";
import { prisma, User } from "./generated/prisma-client";
import { compare } from "bcrypt";
import { AccessToken } from "./generated/prisma-client";
import { sameDayMidnight, daysBetween } from "./utils";
import { User as PrismaUser } from "./generated/prisma-client";

const { JWT_SECRET } = process.env;

// Set specific type for req.user
declare global {
  namespace Express {
    // tslint:disable-next-line:no-empty-interface
    interface User extends PrismaUser {}
  }
}

export const loginError = {
  UNKNOWN_USER: "Aucun utilisateur trouvé avec cet email",
  NOT_ACTIVATED:
    "Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support",
  INVALID_PASSWORD: "Mot de passe incorrect"
};

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (username, password, done) => {
      const user = await prisma.user({ email: username.trim() });
      if (!user) {
        return done(null, false, {
          message: loginError.UNKNOWN_USER
        });
      }
      if (!user.isActive) {
        return done(null, false, {
          message: loginError.NOT_ACTIVATED
        });
      }
      const passwordValid = await compare(password, user.password);
      if (!passwordValid) {
        return done(null, false, { message: loginError.INVALID_PASSWORD });
      }
      return done(null, user);
    }
  )
);

passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

passport.deserializeUser((id: string, done) => {
  prisma
    .user({ id })
    .then(user => done(null, user))
    .catch(err => done(err));
});

const jwtOpts = {
  passReqToCallback: true,
  secretOrKey: JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

passport.use(
  new JwtStrategy(
    jwtOpts,
    async (req: express.Request, jwtPayload: { userId: string }, done) => {
      try {
        const user = await prisma.user({ id: jwtPayload.userId });
        if (user) {
          const token = jwtOpts.jwtFromRequest(req);
          // verify that the token has not been
          // converted to OAuth and revoked
          const accessToken = await prisma.accessToken({ token });
          if (accessToken && accessToken.isRevoked) {
            return done(null, false);
          }
          return done(null, user, { token });
        } else {
          return done(null, false);
        }
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

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
    return prisma.updateAccessToken({
      data: { lastUsed: sameDayMidnight(now).toISOString() },
      where: { token: accessToken.token }
    });
  } else {
    return Promise.resolve();
  }
}

passport.use(
  new BearerStrategy(async (token, done) => {
    try {
      const fragment = `
        fragment AccessTokenWithUser on AccessToken {
          token
          isRevoked
          lastUsed
          user {
            id
            isActive
            email
            name
            phone
            createdAt
            updatedAt
          }
        }
      `;
      const accessToken = await prisma
        .accessToken({ token })
        .$fragment<AccessToken & { user: User }>(fragment);
      if (accessToken && !accessToken.isRevoked) {
        const user = accessToken.user;
        await updateAccessTokenLastUsed(accessToken);
        return done(null, user);
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
  const application = await prisma.application({ id: clientId });
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
 * will be handled by graphql-shield
 */
async function passportCallback(
  req: express.Request,
  next: express.NextFunction,
  user: User,
  callback?: () => Promise<any>
) {
  if (user) {
    req.logIn(user, { session: false }, null);
  }
  if (callback) {
    await callback();
  }
  next();
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
    passport.authenticate("bearer", { session: false }, (_err, user) => {
      passportCallback(req, next, user);
    })
  );
};

/**
 * Middleware used to authenticate request using JWT token
 * It is used for retro-compatibility with not expiring jwt
 * tokens that were emitted before using OAuth tokens saved in db.
 * Upon successful verification, this token is converted to a
 * normal OAuth token
 */
export const passportJwtMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  iffNotAuthenticated(
    req,
    res,
    next,
    passport.authenticate("jwt", { session: false }, (_err, user, opts) => {
      opts = opts ? opts : {};
      passportCallback(req, next, user, () => {
        if (user && opts.token) {
          const token: string = opts.token;
          // save this token to the OAuth access token table
          return prisma.createAccessToken({
            token,
            user: { connect: { id: user.id } },
            lastUsed: new Date().toISOString()
          });
        }
        return Promise.resolve();
      });
    })
  );
};
