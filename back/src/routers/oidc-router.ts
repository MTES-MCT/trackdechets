import { prisma } from "@td/prisma";
import { Router, Request, Response } from "express";
import { oidc, exchange } from "../oauth/oidc";
import ensureLoggedIn from "../common/middlewares/ensureLoggedIn";
import { OAuth2, AuthorizationError, MiddlewareRequest } from "oauth2orize";
import passport from "passport";
import { getUid } from "../utils";
export const oidcRouter = Router();
// OpenID Connect router

// User authorization endpoint.

// Initiate a new transaction and return data to render the dialog
// We check that
// - the user is authenticated
// - the client exists
// - the redirectUri matches
// - the client is openIdEnabled
oidcRouter.get(
  "/oidc/authorize",
  ensureLoggedIn,
  oidc.authorization(async (clientId, redirectUri, done) => {
    const client = await prisma.application.findUnique({
      where: { id: clientId }
    });
    // check state ?
    if (!client) {
      const err = new AuthorizationError(
        "Invalid client id",
        "unauthorized_client"
      );
      return done(err);
    }
    if (!client.redirectUris.includes(redirectUri)) {
      const err = new AuthorizationError(
        "Invalid redirect uri",
        "unauthorized_client"
      );
      return done(err);
    }
    if (!client.openIdEnabled) {
      const err = new AuthorizationError(
        "OpenId Connect is not enabled on this application",
        "unauthorized_client"
      );
      return done(err);
    }
    return done(null, client, redirectUri);
  }),
  (req: Request & { oauth2: OAuth2 }, res: Response) => {
    const payload = {
      transactionID: req.oauth2.transactionID,
      user: {
        name: req.user?.name
      },
      client: {
        name: req.oauth2.client.name,
        logoUrl: req.oauth2.client.logoUrl
      },

      redirectURI: req.oauth2.redirectURI
    };
    return res.json(payload);
  },
  oidc.errorHandler()
);

oidcRouter.post(
  "/oidc/authorize/decision",
  ensureLoggedIn,
  oidc.decision(function (req: MiddlewareRequest & Request, done) {
    const nonce = req?.body?.nonce ?? getUid(32);
    return done(null, { nonce });
  })
);

oidcRouter.post(
  "/oidc/token",
  passport.authenticate(["basic", "oauth2-client-password"], {
    session: false
  }),
  async (req, res, next) => {
    return exchange(req, res, next);
  },
  oidc.errorHandler()
);
