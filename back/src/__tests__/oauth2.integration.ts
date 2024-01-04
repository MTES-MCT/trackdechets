import { prisma } from "@td/prisma";
import supertest from "supertest";
import { resetDatabase } from "../../integration-tests/helper";
import { tokenErrorMessages } from "../oauth/oauth2";
import { app } from "../server";
import { getUid, hashToken } from "../utils";
import { logIn } from "./auth.helper";
import { applicationFactory, userFactory } from "./factories";

const request = supertest(app);

describe("GET /oauth2/authorize", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  it("should return a transaction id, redirect uri, client and user", async () => {
    const application = await applicationFactory();

    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const res = await request
      .get("/oauth2/authorize")
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
    const application = await applicationFactory();

    const res = await request
      .get("/oauth2/authorize")
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
      .get("/oauth2/authorize")
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

    const application = await applicationFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const res = await request
      .get("/oauth2/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: "http://unkown.com" });

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("unauthorized_client");
    expect(res.body.error_description).toEqual("Invalid redirect uri");
  });
});

describe("/oauth2/authorize/decision", () => {
  it("should return code if decision is approved", async () => {
    const application = await applicationFactory();

    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const authorize = await request
      .get("/oauth2/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: application.redirectUris[0] });

    const { transactionID } = authorize.body;

    const decision = await request
      .post("/oauth2/authorize/decision")
      .set("Cookie", sessionCookie)
      .send(`transaction_id=${transactionID}`)
      .send("allow=Allow");

    // should have created a grant
    expect(
      await prisma.grant.count({
        where: {
          user: { id: user.id },
          application: { id: application.id }
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

  it("should deny access if decision is not approved", async () => {
    const application = await applicationFactory();

    const user = await userFactory();

    const { sessionCookie } = await logIn(app, user.email, "pass");

    const authorize = await request
      .get("/oauth2/authorize")
      .set("Cookie", sessionCookie)
      .query({ response_type: "code" })
      .query({ client_id: application.id })
      .query({ redirect_uri: application.redirectUris[0] });

    const { transactionID } = authorize.body;

    const decision = await request
      .post("/oauth2/authorize/decision")
      .set("Cookie", sessionCookie)
      .send(`transaction_id=${transactionID}`)
      .send("cancel=Cancel");

    const redirect = decision.header.location;
    expect(redirect).toEqual(
      `${application.redirectUris[0]}?error=access_denied`
    );
  });
});

describe("/oauth2/token", () => {
  it("should deny access to an unauthenticated client", async () => {
    const application = await applicationFactory();

    const res = await request
      .post("/oauth2/token")
      .send("grant_type=authorization_code")
      .send(`code=any`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).toEqual(401);
  });

  it("should deny access to a client with wrong credentials", async () => {
    const application = await applicationFactory();

    const res = await request
      .post("/oauth2/token")
      .send("grant_type=authorization_code")
      .send(`code=any`)
      .send(`client_id=${application.id}`)
      .send(`client_secret=wrong_secret`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).toEqual(401);
  });

  it("should authenticate client using oauth2-client-password-strategy", async () => {
    const application = await applicationFactory();

    // client credentials are passed in the body
    const res = await request
      .post("/oauth2/token")
      .send("grant_type=authorization_code")
      .send(`code=any`)
      .send(`client_id=${application.id}`)
      .send(`client_secret=${application.clientSecret}`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).not.toEqual(401);
  });

  it("should authenticate client using basic strategy", async () => {
    const application = await applicationFactory();

    const clientCredentials = Buffer.from(
      `${application.id}:${application.clientSecret}`
    ).toString("base64");

    // client credentials are passed in the body
    const res = await request
      .post("/oauth2/token")
      .set("Authorization", `Basic ${clientCredentials}`)
      .send("grant_type=authorization_code")
      .send(`code=any`)
      .send(`client_id=${application.id}`)
      .send(`client_secret=${application.clientSecret}`)
      .send(`redirect_uri=${application.redirectUris[0]}`);

    expect(res.status).not.toEqual(401);
  });

  it("should exchange a valid code grant for a token", async () => {
    const application = await applicationFactory();

    const user = await userFactory();

    const code = getUid(16);

    const grant = await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0]
      }
    });

    const res = await request
      .post("/oauth2/token")
      .send("grant_type=authorization_code")
      .send(`code=${grant.code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(200);

    // an accessToken should have been created
    expect(
      await prisma.accessToken.count({
        where: { application: { id: application.id }, user: { id: user.id } }
      })
    ).toEqual(1);

    const accessToken = (
      await prisma.accessToken.findMany({
        where: { application: { id: application.id }, user: { id: user.id } }
      })
    )[0];
    const { access_token, token_type, user: responseUser } = res.body;
    expect(hashToken(access_token)).toEqual(accessToken.token);
    expect(token_type).toEqual("Bearer");
    expect(responseUser).toEqual({
      email: user.email,
      name: user.name
    });
  });

  it("should return 403 if authorization code is invalid", async () => {
    const application = await applicationFactory();

    const res = await request
      .post("/oauth2/token")
      .send("grant_type=authorization_code")
      .send(`code=invalid_code`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=${application.redirectUris[0]}`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(tokenErrorMessages.invalid_code);
  });

  it("should return 403 if redirect uri is invalid", async () => {
    const application = await applicationFactory();

    const user = await userFactory();

    const code = getUid(16);

    await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application.id } },
        expires: 10 * 60,
        redirectUri: application.redirectUris[0]
      }
    });

    const res = await request
      .post("/oauth2/token")
      .send("grant_type=authorization_code")
      .send(`code=${code}`)
      .send(`client_id=${application.id}`)
      .send(`redirect_uri=invalid_redirect_ui`)
      .send(`client_secret=${application.clientSecret}`);

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(
      tokenErrorMessages.invalid_redirect_uri
    );
  });

  it("should return 403 if client id is invalid", async () => {
    const application1 = await applicationFactory();
    const application2 = await applicationFactory();

    const user = await userFactory();

    const code = getUid(16);

    await prisma.grant.create({
      data: {
        user: { connect: { id: user.id } },
        code,
        application: { connect: { id: application1.id } },
        expires: 10 * 60,
        redirectUri: application1.redirectUris[0]
      }
    });

    const res = await request
      .post("/oauth2/token")
      .send("grant_type=authorization_code")
      .send(`code=${code}`)
      .send(`client_id=${application2.id}`)
      .send(`redirect_uri=${application1.redirectUris[0]}`)
      .send(`client_secret=${application2.clientSecret}`);

    expect(res.status).toEqual(403);
    expect(res.body.error).toEqual("invalid_grant");
    expect(res.body.error_description).toEqual(
      tokenErrorMessages.invalid_client_id
    );
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
        redirectUri: application.redirectUris[0]
      }
    });

    const res = await request
      .post("/oauth2/token")
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
