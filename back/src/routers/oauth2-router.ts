import { prisma } from "@td/prisma";
import { Router, Request, Response } from "express";
import passport from "passport";
import { oauth2server } from "../oauth/oauth2";
import ensureLoggedIn from "../common/middlewares/ensureLoggedIn";
import { OAuth2, AuthorizationError } from "oauth2orize";

export const oauth2Router = Router();

// User authorization endpoint.

// Initiate a new transaction and return data to render the dialog
// We check that
// - the user is authenticated
// - the client exists
// - the redirectUri matches
oauth2Router.get(
  "/oauth2/authorize",
  ensureLoggedIn,
  oauth2server.authorization(async (clientId, redirectUri, done) => {
    const client = await prisma.application.findUnique({
      where: { id: clientId }
    });
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
    return done(null, client, redirectUri);
  }),
  (req: Request & { oauth2: OAuth2 }, res: Response) => {
    const payload = {
      transactionID: req.oauth2.transactionID,
      user: {
        name: req.user!.name
      },
      client: {
        name: req.oauth2.client.name,
        logoUrl: req.oauth2.client.logoUrl
      },
      redirectURI: req.oauth2.redirectURI
    };
    return res.json(payload);
  },
  oauth2server.errorHandler()
);

oauth2Router.post(
  "/oauth2/authorize/decision",
  ensureLoggedIn,
  oauth2server.decision()
);

oauth2Router.post(
  "/oauth2/token",
  passport.authenticate(["basic", "oauth2-client-password"], {
    session: false
  }),
  oauth2server.token(),
  oauth2server.errorHandler()
);
