import { prisma } from "@td/prisma";
import supertest from "supertest";
import { resetDatabase } from "../../integration-tests/helper";
import { tokenErrorMessages } from "../oauth/oidc";
import { app } from "../server";
import { getUid } from "../utils";
import { logIn } from "./auth.helper";
import {
  applicationFactory,
  userFactory,
  userWithCompanyFactory
} from "./factories";
import { CompanyVerificationStatus } from "@prisma/client";
import * as jose from "jose";

const request = supertest(app);

describe("GET /oidc/authorize", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  it("should return a transaction id, redirect uri, client and user", async () => {
    const application = await applicationFactory(true);

    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const res = await request
      .get("/oidc/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: application.redirectUris[0] });

    expect(res.body.transactionID).toBeDefined();
    expect(res.body.transactionID).toHaveLength(8);
    expect(res.body.redirectURI).toEqual(application.redirectUris[0]);
    expect(res.body.client).toEqual({
      name: application.name,
      logoUrl: application.logoUrl
    });
    expect(res.body.user).toEqual({ name: user.name });
  });

  it("should return 401 if user is not authenticated", async () => {
    const application = await applicationFactory(true);

    const res = await request
      .get("/oidc/authorize")
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: application.redirectUris[0] });

    expect(res.status).toEqual(401);
    expect(res.body.error).toEqual("Not Authorized");
  });

  it("should return 403 if clientId does not exist", async () => {
    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const res = await request
      .get("/oidc/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: "unknown" })
      .query({ redirect_uri: "http://unkown.com" });

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("unauthorized_client");
    expect(res.body.error_description).toEqual("Invalid client id");
  });

  it("should return 403 if redirect uri is not allowed", async () => {
    const user = await userFactory();

    const application = await applicationFactory(true);

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const res = await request
      .get("/oidc/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: "http://unkown.com" });

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("unauthorized_client");
    expect(res.body.error_description).toEqual("Invalid redirect uri");
  });

  it("should return 403 if openid connect is not enabled", async () => {
    const user = await userFactory();

    const application = await applicationFactory(); // not enabled

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const res = await request
      .get("/oidc/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: application.redirectUris[0] });

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("unauthorized_client");
    expect(res.body.error_description).toEqual(
      "OpenId Connect is not enabled on this application"
    );
  });
});

describe("/oidc/authorize/decision", () => {
  it("should return code if decision is approved", async () => {
    const application = await applicationFactory(true);

    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const authorize = await request
      .get("/oidc/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: application.redirectUris[0] })
      .query({ scope: "openid" });

    const { transactionID } = authorize.body;

    const decision = await request
      .post("/oidc/authorize/decision?scope=openid")
      .set("Cookie", sessionCookie)
      .send(`transaction_id=${transactionID}`);

    // should have created a grant
    expect(
      await prisma.grant.count({
        where: {
          user: { id: user.id },
          application: { id: application.id },
          openIdEnabled: true
        }
      })
    ).toEqual(1);

    // should pass the grant code as query in the redirect uri
    const redirect = decision.header.location;
    const grants = await prisma.grant.findMany({
      where: { user: { id: user.id }, application: { id: application.id } }
    });
    expect(redirect).toEqual(
      `${application.redirectUris[0]}?code=${grants[0].code}`
    );
  });

  it("should create grant with passed scope", async () => {
    const application = await applicationFactory(true);

    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const authorize = await request
      .get("/oidc/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ nonce: "" })
      .query({ redirect_uri: application.redirectUris[0] })
      .query({ scope: "openid profile email companies" });

    const { transactionID } = authorize.body;

    await request
      .post("/oidc/authorize/decision?scope=openid&nonce=wsd123")
      .set("Cookie", sessionCookie)
      .send(`transaction_id=${transactionID}`);

    // should have created a grant with provided scope

    const grant = await prisma.grant.findFirst({
      where: {
        user: { id: user.id },
        application: { id: application.id },
        openIdEnabled: true
      }
    });

    expect(grant!.scope).toEqual(["openid", "profile", "email", "companies"]);
    expect(grant!.nonce).toBeTruthy(); // nonce is a random value when not provided in the request
  });

  it("should forbid funny scope values", async () => {
    const application = await applicationFactory(true);

    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const authorize = await request
      .get("/oidc/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: application.redirectUris[0] })
      .query({ scope: "openid profile exotic" }); // some scope values are not acceptable

    const { transactionID } = authorize.body;

    const res = await request
      .post("/oidc/authorize/decision?scope=openid")
      .set("Cookie", sessionCookie)
      .send(`transaction_id=${transactionID}`);

    // no grant created
    expect(
      await prisma.grant.count({
        where: {
          user: { id: user.id },
          application: { id: application.id },
          openIdEnabled: true
        }
      })
    ).toEqual(0);

    expect(res.status).toEqual(400);
  });

  it("should forbid oidc workflow on a non openidEnabled application", async () => {
    const application = await applicationFactory(true); //   openIdEnabled for GET request

    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const authorize = await request
      .get("/oidc/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: application.redirectUris[0] })
      .query({ scope: "openid" });

    const { transactionID } = authorize.body;

    // set ooenIdEnabled to false for POST request
    await prisma.application.update({
      where: { id: application.id },
      data: { openIdEnabled: false }
    });

    const res = await request
      .post("/oidc/authorize/decision?scope=openid")
      .set("Cookie", sessionCookie)
      .send(`transaction_id=${transactionID}`);

    // no grant created
    expect(
      await prisma.grant.count({
        where: {
          user: { id: user.id },
          application: { id: application.id },
          openIdEnabled: true
        }
      })
    ).toEqual(0);

    expect(res.status).toEqual(403);
  });

  it("should deny access if decision is not approved", async () => {
    const application = await applicationFactory(true);

    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const authorize = await request
      .get("/oidc/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: application.redirectUris[0] });

    const { transactionID } = authorize.body;

    const decision = await request
      .post("/oidc/authorize/decision")
      .set("Cookie", sessionCookie)
      .send(`transaction_id=${transactionID}`)
      .send("cancel=Cancel");

    const redirect = decision.header.location;
    expect(redirect).toEqual(
      `${application.redirectUris[0]}?error=access_denied`
    );
  });
});

describe("/oidc/token - id/secret auth", () => {
  it("should deny access to an unauthenticated client", async () => {
    const application = await applicationFactory(true);

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=any`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).toEqual(401);
  });

  it("should deny access to a client with wrong credentials", async () => {
    const application = await applicationFactory(true);

    await prisma.grant.create({
      data: {
        user: { connect: { id: application.adminId! } },
        code: getUid(16),
        application: { connect: { id: application.id } },
        expires: 1 * 60, // 1 minute
        openIdEnabled: true,
        redirectUri: application.redirectUris[0],
        scope: ["openid"]
      }
    });

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=any`)
      .send(`client_id=${application.id}`)
      .send(`client_secret=wrong_secret`)
      .send(`redirect_uri=${application.redirectUris[0]}`);
    expect(res.status).toEqual(401);
  });

  it("should exchange a valid code grant for a token - base scope", async () => {
    const spki = process.env.OIDC_PUBLIC_KEY;
    const alg = "RS256";

    const publicKey = await jose.importSPKI(spki!, alg);

    const application = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid"]
      }
    });

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(200);

    const { id_token } = res.body;

    const { payload, protectedHeader } = await jose.jwtVerify(
      id_token,
      publicKey,
      {
        issuer: "trackdechets",
        audience: application.id
      }
    );

    expect(protectedHeader).toEqual({ alg: "RS256" });
    expect(payload.aud).toEqual(application.id);
    expect(payload.iss).toEqual("trackdechets");
    expect(payload.sub).toEqual(user.id);
    expect(payload.email).toBe(undefined);
    expect(payload.emailVerified).toBe(undefined);
  });

  it("should exchange a valid code grant for a token - email scope", async () => {
    const spki = process.env.OIDC_PUBLIC_KEY;
    const alg = "RS256";

    const publicKey = await jose.importSPKI(spki!, alg);

    const application = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid", "email"]
      }
    });

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(200);

    const body = res.body;

    const { id_token } = body;

    const { payload, protectedHeader } = await jose.jwtVerify(
      id_token,
      publicKey,
      {
        issuer: "trackdechets",
        audience: application.id
      }
    );

    expect(protectedHeader).toEqual({ alg: "RS256" });
    expect(payload.aud).toEqual(application.id);
    expect(payload.iss).toEqual("trackdechets");
    expect(payload.sub).toEqual(user.id);
    expect(payload.email).toEqual(user.email);
    expect(payload.email_verified).toEqual(true);
    expect(payload.name).toBe(undefined);
    expect(payload.phone).toBe(undefined);
    expect(payload.companies).toBe(undefined);
  });

  it("should exchange a valid code grant for a token - profile scope", async () => {
    const spki = process.env.OIDC_PUBLIC_KEY;
    const alg = "RS256";

    const publicKey = await jose.importSPKI(spki!, alg);

    const application = await applicationFactory(true);

    const user = await userFactory({ phone: "0617665544" });

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid", "profile"]
      }
    });

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(200);

    const body = res.body;

    const { id_token } = body;

    const { payload, protectedHeader } = await jose.jwtVerify(
      id_token,
      publicKey,
      {
        issuer: "trackdechets",
        audience: application.id
      }
    );

    expect(protectedHeader).toEqual({ alg: "RS256" });
    expect(payload.aud).toEqual(application.id);
    expect(payload.iss).toEqual("trackdechets");
    expect(payload.sub).toEqual(user.id);
    expect(payload.email).toBe(undefined);
    expect(payload.email_verified).toBe(undefined);
    expect(payload.name).toBe(user.name);
    expect(payload.phone).toBe(user.phone);
    expect(payload.companies).toBe(undefined);
  });

  it("should exchange a valid code grant for a token - companies scope", async () => {
    const spki = process.env.OIDC_PUBLIC_KEY;
    const alg = "RS256";

    const publicKey = await jose.importSPKI(spki!, alg);

    const application = await applicationFactory(true);

    const { user, company } = await userWithCompanyFactory("ADMIN", {
      vatNumber: "ES0541696002",
      name: "the company",
      givenName: "happy company",
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid", "companies"]
      }
    });

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(200);

    const body = res.body;

    const { id_token } = body;

    const { payload, protectedHeader } = await jose.jwtVerify(
      id_token,
      publicKey,
      {
        issuer: "trackdechets",
        audience: application.id
      }
    );

    expect(protectedHeader).toEqual({ alg: "RS256" });
    expect(payload.aud).toEqual(application.id);
    expect(payload.iss).toEqual("trackdechets");
    expect(payload.sub).toEqual(user.id);
    expect(payload.email).toBe(undefined);
    expect(payload.email_verified).toBe(undefined);
    expect(payload.name).toBe(undefined);
    expect(payload.phone).toBe(undefined);
    expect(payload.companies).toEqual([
      {
        role: "ADMIN",
        id: company.id,
        siret: company.siret,
        vat_number: "ES0541696002",
        name: "the company",
        given_name: "happy company",
        types: [
          "PRODUCER",
          "TRANSPORTER",
          "WASTEPROCESSOR",
          "WORKER",
          "WASTE_VEHICLES"
        ],
        verified: false
      }
    ]);
  });

  it("should return 403 if grant is not openIdEnabled", async () => {
    const application = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 3 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: false,
        scope: ["openid"]
      }
    });
    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(tokenErrorMessages.invalid_code);
  });

  it("should return 403 if authorization code is invalid", async () => {
    const application = await applicationFactory(true);

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=invalid_code`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(tokenErrorMessages.invalid_code);
  });

  it("should return 401 if redirect uri is invalid", async () => {
    const application = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 3 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid"]
      }
    });

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=${code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=invalid_redirect_ui`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(401);
    expect(res.body.error).toEqual("invalid_client");
    expect(res.body.error_description).toEqual(
      tokenErrorMessages.invalid_redirect_uri
    );
  });

  it("should return 401 if client id is invalid", async () => {
    const application1 = await applicationFactory(true);
    const application2 = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application1.id } },
        expires: 10 * 60,
        redirectUri: application1.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid"]
      }
    });

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=${code}`)
      .send(`client_id=${application2.id}`)
      .send(`redirect_uri=${application1.redirectUris[0]}`)
      .send(`client_secret=${application2.clientSecret}`);

    expect(res.status).toEqual(403);

    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(tokenErrorMessages.invalid_code);
  });

  it("should return 403 if grant has expired", async () => {
    const application = await applicationFactory();

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 0,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid"]
      }
    });

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(403);

    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(
      tokenErrorMessages.grant_expired
    );
  });
});

describe("/oidc/token - basic auth", () => {
  it("should deny access to a client with wrong credentials", async () => {
    const application = await applicationFactory(true);

    await prisma.grant.create({
      data: {
        user: { connect: { id: application.adminId! } },
        code: getUid(16),
        application: { connect: { id: application.id } },
        expires: 1 * 60, // 1 minute
        openIdEnabled: true,
        redirectUri: application.redirectUris[0],
        scope: ["openid"]
      }
    });

    const clientCredentials = Buffer.from(
      `${application.id}:wrong_secret`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=any`)

      .send(`redirect_uri=${application.redirectUris[0]}`);
    expect(res.status).toEqual(401);
  });

  it("should exchange a valid code grant for a token - base scope", async () => {
    const spki = process.env.OIDC_PUBLIC_KEY;
    const alg = "RS256";

    const publicKey = await jose.importSPKI(spki!, alg);

    const application = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid"],
        nonce: "xyz"
      }
    });
    const clientCredentials = Buffer.from(
      `${application.id}:${application.clientSecret}`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).toEqual(200);

    const { id_token } = res.body;

    const { payload, protectedHeader } = await jose.jwtVerify(
      id_token,
      publicKey,
      {
        issuer: "trackdechets",
        audience: application.id
      }
    );

    expect(protectedHeader).toEqual({ alg: "RS256" });
    expect(payload.aud).toEqual(application.id);
    expect(payload.iss).toEqual("trackdechets");
    expect(payload.nonce).toEqual("xyz");
    expect(payload.sub).toEqual(user.id);
    expect(payload.email).toBe(undefined);
    expect(payload.emailVerified).toBe(undefined);
  });

  it("should exchange a valid code grant for a token - email scope", async () => {
    const spki = process.env.OIDC_PUBLIC_KEY;
    const alg = "RS256";

    const publicKey = await jose.importSPKI(spki!, alg);

    const application = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid", "email"]
      }
    });

    const clientCredentials = Buffer.from(
      `${application.id}:${application.clientSecret}`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).toEqual(200);

    const body = res.body;

    const { id_token } = body;

    const { payload, protectedHeader } = await jose.jwtVerify(
      id_token,
      publicKey,
      {
        issuer: "trackdechets",
        audience: application.id
      }
    );

    expect(protectedHeader).toEqual({ alg: "RS256" });
    expect(payload.aud).toEqual(application.id);
    expect(payload.iss).toEqual("trackdechets");
    expect(payload.sub).toEqual(user.id);
    expect(payload.email).toEqual(user.email);
    expect(payload.email_verified).toEqual(true);
    expect(payload.name).toBe(undefined);
    expect(payload.phone).toBe(undefined);
    expect(payload.companies).toBe(undefined);
  });

  it("should exchange a valid code grant for a token - email scope", async () => {
    const spki = process.env.OIDC_PUBLIC_KEY;
    const alg = "RS256";

    const publicKey = await jose.importSPKI(spki!, alg);

    const application = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid", "email"]
      }
    });

    const clientCredentials = Buffer.from(
      `${application.id}:${application.clientSecret}`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      // .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`);
    // .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(200);

    const body = res.body;

    const { id_token } = body;

    const { payload, protectedHeader } = await jose.jwtVerify(
      id_token,
      publicKey,
      {
        issuer: "trackdechets",
        audience: application.id
      }
    );

    expect(protectedHeader).toEqual({ alg: "RS256" });
    expect(payload.aud).toEqual(application.id);
    expect(payload.iss).toEqual("trackdechets");
    expect(payload.sub).toEqual(user.id);
    expect(payload.email).toEqual(user.email);
    expect(payload.email_verified).toEqual(true);
    expect(payload.name).toBe(undefined);
    expect(payload.phone).toBe(undefined);
    expect(payload.companies).toBe(undefined);
  });
  it("should exchange a valid code grant for a token - profile scope", async () => {
    const spki = process.env.OIDC_PUBLIC_KEY;
    const alg = "RS256";

    const publicKey = await jose.importSPKI(spki!, alg);

    const application = await applicationFactory(true);

    const user = await userFactory({ phone: "0617665544" });

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid", "profile"]
      }
    });

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(200);

    const body = res.body;

    const { id_token } = body;

    const { payload, protectedHeader } = await jose.jwtVerify(
      id_token,
      publicKey,
      {
        issuer: "trackdechets",
        audience: application.id
      }
    );

    expect(protectedHeader).toEqual({ alg: "RS256" });
    expect(payload.aud).toEqual(application.id);
    expect(payload.iss).toEqual("trackdechets");
    expect(payload.sub).toEqual(user.id);
    expect(payload.email).toBe(undefined);
    expect(payload.email_verified).toBe(undefined);
    expect(payload.name).toBe(user.name);
    expect(payload.phone).toBe(user.phone);
    expect(payload.companies).toBe(undefined);
  });

  it("should exchange a valid code grant for a token - companies scope", async () => {
    const spki = process.env.OIDC_PUBLIC_KEY;
    const alg = "RS256";

    const publicKey = await jose.importSPKI(spki!, alg);

    const application = await applicationFactory(true);

    const { user, company } = await userWithCompanyFactory("ADMIN", {
      vatNumber: "BE0541696002",
      name: "the company",
      givenName: "happy company"
    });

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid", "companies"]
      }
    });

    const clientCredentials = Buffer.from(
      `${application.id}:${application.clientSecret}`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).toEqual(200);

    const body = res.body;

    const { id_token } = body;

    const { payload, protectedHeader } = await jose.jwtVerify(
      id_token,
      publicKey,
      {
        issuer: "trackdechets",
        audience: application.id
      }
    );

    expect(protectedHeader).toEqual({ alg: "RS256" });
    expect(payload.aud).toEqual(application.id);
    expect(payload.iss).toEqual("trackdechets");

    expect(payload.sub).toEqual(user.id);
    expect(payload.email).toBe(undefined);
    expect(payload.email_verified).toBe(undefined);
    expect(payload.name).toBe(undefined);
    expect(payload.phone).toBe(undefined);
    expect(payload.companies).toEqual([
      {
        role: "ADMIN",
        id: company.id,
        siret: company.siret,
        vat_number: "BE0541696002",
        name: "the company",
        given_name: "happy company",
        types: [
          "PRODUCER",
          "TRANSPORTER",
          "WASTEPROCESSOR",
          "WORKER",
          "WASTE_VEHICLES"
        ],
        verified: true
      }
    ]);
  });

  it("should return 403 if grant is not openIdEnabled", async () => {
    const application = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 3 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: false,
        scope: ["openid"]
      }
    });

    const clientCredentials = Buffer.from(
      `${application.id}:${application.clientSecret}`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .send("grant_type=authorization_code")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send(`code=${grant.code}`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(tokenErrorMessages.invalid_code);
  });

  it("should return 403 if authorization code is invalid", async () => {
    const application = await applicationFactory(true);

    const clientCredentials = Buffer.from(
      `${application.id}:${application.clientSecret}`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=invalid_code`)

      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(tokenErrorMessages.invalid_code);
  });

  it("should return 401 if redirect uri is invalid", async () => {
    const application = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 3 * 60,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid"]
      }
    });

    const clientCredentials = Buffer.from(
      `${application.id}:${application.clientSecret}`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=${code}`)
      .send(`redirect_uri=invalid_redirect_ui`);

    expect(res.status).toEqual(401);
    expect(res.body.error).toEqual("invalid_client");
    expect(res.body.error_description).toEqual(
      tokenErrorMessages.invalid_redirect_uri
    );
  });

  it("should return 401 if client id is invalid", async () => {
    const application1 = await applicationFactory(true);
    const application2 = await applicationFactory(true);

    const user = await userFactory();

    const code = getUid(16);

    await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application1.id } },
        expires: 10 * 60,
        redirectUri: application1.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid"]
      }
    });

    const clientCredentials = Buffer.from(
      `${application2.id}:${application2.clientSecret}`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=${code}`)
      .send(`redirect_uri=${application1.redirectUris[0]}`);

    expect(res.status).toEqual(403);

    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(tokenErrorMessages.invalid_code);
  });

  it("should return 403 if grant has expired", async () => {
    const application = await applicationFactory();

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 0,
        redirectUri: application.redirectUris[0],
        openIdEnabled: true,
        scope: ["openid"]
      }
    });

    const clientCredentials = Buffer.from(
      `${application.id}:${application.clientSecret}`
    ).toString("base64");

    const res = await request
      .post("/oidc/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).toEqual(403);

    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(
      tokenErrorMessages.grant_expired
    );
  });
});
