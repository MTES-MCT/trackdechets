import { Grant } from "@prisma/client";
import { createServer, grant, exchange, TokenError } from "oauth2orize";
import prisma from "src/prisma";
import { getUid } from "./utils";

// Create OAuth 2.0 server
export const oauth2server = createServer();

// Register serialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated. To complete the transaction, the
// user must authenticate and approve the authorization request. Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.

oauth2server.serializeClient((client, done) => done(null, client.id));

oauth2server.deserializeClient(async (id, done) => {
  const client = await prisma.application.findOne({ where: { id } });
  return done(null, client);
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources. It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes. The callback takes the `client` requesting
// authorization, the `redirectUri` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application. The application issues a code, which is bound to these
// values, and will be exchanged for an access token.
oauth2server.grant(
  grant.code(async (client, redirectUri, user, _ares, done) => {
    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code: getUid(16),
        application: { connect: { id: client.id } },
        expires: 10 * 60, // recommended by https://tools.ietf.org/html/rfc6749#section-4.1.2
        redirectUri
      }
    });
    done(null, grant.code);
  })
);

export const tokenErrorMessages = {
  invalid_code: "Invalid authorization code",
  invalid_redirect_uri: "Invalid redirect uri",
  invalid_client_id: "Invalid client id",
  grant_expired: "Grant has expired"
};

// Exchange authorization codes for access tokens. The callback accepts the
// `client`, which is exchanging `code` and any `redirectUri` from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code. The issued access token response can include a refresh token and
// custom parameters by adding these to the `done()` call
oauth2server.exchange(
  exchange.code(async (client, code, redirectUri, done) => {
    const grant = await prisma.grant.findFirst({
      where: { code },
      include: { user: true, application: true }
    });
    if (!grant) {
      const err = new TokenError(
        tokenErrorMessages.invalid_code,
        "invalid_grant"
      );
      return done(err);
    }
    if (redirectUri !== grant.redirectUri) {
      const err = new TokenError(
        tokenErrorMessages.invalid_redirect_uri,
        "invalid_grant"
      );
      return done(err);
    }
    if (client.id !== grant.application.id) {
      const err = new TokenError(
        tokenErrorMessages.invalid_client_id,
        "invalid_grant"
      );
      return done(err);
    }
    if (isExpired(grant)) {
      const err = new TokenError(
        tokenErrorMessages.grant_expired,
        "invalid_grant"
      );
      return done(err);
    }

    const token = getUid(40);

    const accessToken = await prisma.accessToken.create({
      data: {
        user: {
          connect: { id: grant.user.id }
        },
        application: {
          connect: { id: grant.application.id }
        },
        token
      }
    });

    // Add custom params
    const params = { user: { name: grant.user.name, email: grant.user.email } };

    return done(null, accessToken.token, null, params);
  })
);

/**
 * Check whether or not a grant has expired
 * @param grant
 */
export function isExpired(grant: Grant): boolean {
  const now = Date.now();
  const createdAt = new Date(grant.createdAt);
  const elapsed = (now - createdAt.getTime()) / 1000;
  return elapsed > grant.expires;
}
