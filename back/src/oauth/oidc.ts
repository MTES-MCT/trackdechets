import {
  createServer,
  grant,
  TokenError,
  AuthorizationError
} from "oauth2orize";
import { isExpired } from "./utils";
import { prisma } from "@td/prisma";
import { getUid } from "../utils";
import { buildIdToken } from "./token";
import {
  OID_SCOPE,
  EMAIL_SCOPE,
  PROFILE_SCOPE,
  COMPANIES_SCOPE
} from "./scopes";
import xss from "xss";
// Create OpenId Connect server
export const oidc = createServer();

// Register serialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated. To complete the transaction, the
// user must authenticate and approve the authorization request. Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.

oidc.serializeClient((client, done) => done(null, client.id));

oidc.deserializeClient(async (id, done) => {
  const client = await prisma.application.findUnique({ where: { id } });
  return done(null, client);
});

export const authErrorMessages = {
  invalid_request: "invalid_request",
  unauthorized_client: "unauthorized_client redirect uri",
  invalid_scope: "invalid_scope client id",
  unsupported_response_type: "unsupported_response_type",
  access_denied: "access_denied"
};

const SCOPES = [OID_SCOPE, EMAIL_SCOPE, PROFILE_SCOPE, COMPANIES_SCOPE];

oidc.grant(
  // missing appropriate arity function definition
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  grant.code(async (client, redirectUri, user, _ares, _areq, done) => {
    const scope = _areq.scope;
    const nonce = _ares.nonce;

    if (!client.openIdEnabled) {
      return done(
        new AuthorizationError(
          "Unauthorized client for this protocol",
          "unauthorized_client"
        )
      );
    }

    //unspecified
    if (!scope) {
      return done(
        new AuthorizationError("Scope is mandatory", "invalid_scope")
      );
    }

    //missing oid scope item
    if (!scope.includes(OID_SCOPE)) {
      return done(
        new AuthorizationError("Openid Scope is mandatory", "invalid_scope")
      );
    }
    //unsupported scope items
    if (scope.some(sc => !SCOPES.includes(sc))) {
      return done(new AuthorizationError("Invalid scope", "invalid_scope"));
    }
    // redundant scope items
    if (scope.length !== new Set(scope).size) {
      return done(new AuthorizationError("Invalid scope", "invalid_scope"));
    }

    // create openIdEnabled short-lived grant
    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code: getUid(16),
        application: { connect: { id: client.id } },
        expires: 1 * 60, // 1 minute
        openIdEnabled: true,
        redirectUri,
        scope,
        nonce: xss(nonce)
      }
    });
    done(null, grant.code);
  })
);

export const tokenErrorMessages = {
  invalid_code: "Invalid authorization code",
  invalid_redirect_uri: "Invalid redirect uri",
  invalid_client_id: "Invalid client id",
  grant_expired: "Grant has expired",
  missing_code: "Code is required",
  unsupported_grant_type:
    "Grant type is required and must be authorization_code"
};

// TokenError supported codes and matching HTTP response codes
// 'invalid_request': status = 400
// 'invalid_client': status = 401
// 'invalid_grant': status = 403
// 'unauthorized_client': status = 403
// 'unsupported_grant_type': status = 501
// 'invalid_scope': status = 400;

// Exchange authorization codes for a RSA signed ID token.
export const exchange = async (req, res, next) => {
  const client_id = req.user.id; // user is an Application object

  const { code, redirect_uri, grant_type } = req.body;
  // Application checks (client id and secret) are performed by passport in router
  if (!code) {
    return next(
      new TokenError(tokenErrorMessages.invalid_code, "invalid_grant")
    );
  }

  if (!grant_type || grant_type !== "authorization_code") {
    return next(
      new TokenError(
        tokenErrorMessages.unsupported_grant_type,
        "unsupported_grant_type"
      )
    );
  }

  const grant = await prisma.grant.findFirst({
    where: {
      code,
      applicationId: client_id,
      openIdEnabled: true
    },
    include: { user: true, application: true }
  });

  if (!grant) {
    return next(
      new TokenError(tokenErrorMessages.invalid_code, "invalid_grant")
    );
  }

  // client redirect uri does not match
  if (!redirect_uri || !grant.application.redirectUris.includes(redirect_uri)) {
    return next(
      new TokenError(tokenErrorMessages.invalid_redirect_uri, "invalid_client")
    );
  }

  // grant expired
  if (isExpired(grant)) {
    return next(
      new TokenError(tokenErrorMessages.grant_expired, "invalid_grant")
    );
  }

  const jwt = await buildIdToken(grant);

  // openid connect grants are not meant to be reused
  await prisma.grant.delete({ where: { id: grant.id } });

  return res.send({ id_token: jwt, access_token: "" });
};
