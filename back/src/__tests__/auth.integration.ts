import { resetDatabase } from "../../integration-tests/helper";
import supertest from "supertest";
import { app, sess } from "../server";
import { prisma } from "../generated/prisma-client";
import { getLoginError } from "../auth";
import queryString from "querystring";
import { sign } from "jsonwebtoken";
import { getUid } from "../utils";
import { userFactory } from "./factories";

const { UI_HOST, JWT_SECRET } = process.env;

const request = supertest(app);
const loginError = getLoginError("Some User");

describe("POST /login", () => {
  afterEach(() => resetDatabase());

  it("create a persistent session if login form is valid", async () => {
    const user = await userFactory();

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    // should send trackdechets.connect.sid cookie
    expect(login.header["set-cookie"]).toHaveLength(1);
    const cookieRegExp = new RegExp(
      `${sess.name}=(.+); Domain=${sess.cookie.domain}; Path=/; Expires=.+; HttpOnly`
    );
    const sessionCookie = login.header["set-cookie"][0];
    expect(sessionCookie).toMatch(cookieRegExp);

    // should redirect to /dashboard/
    expect(login.status).toBe(302);
    expect(login.header.location).toBe(`http://${UI_HOST}/dashboard/`);

    const cookieValue = sessionCookie.match(cookieRegExp)[1];

    // should persist user across requests
    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", `${sess.name}=${cookieValue}`);

    expect(res.body.data).toEqual({
      me: { email: user.email }
    });
  });

  it("should not authenticate an unknown user", async () => {
    const login = await request
      .post("/login")
      .send("email=unknown-user")
      .send("password=password");

    // should not set a session cookie
    expect(login.header["set-cookie"]).toBeUndefined();

    // should redirect to /login with error message
    expect(login.status).toBe(302);
    const redirect = login.header.location;
    expect(redirect).toContain(`http://${UI_HOST}/login`);
    expect(redirect).toContain(
      queryString.escape(loginError.UNKNOWN_USER.message)
    );
    expect(redirect).toContain(
      queryString.escape(loginError.UNKNOWN_USER.errorField)
    );
  });

  it("should not authenticate a user whose email has not been validated", async () => {
    const user = await userFactory({ isActive: false });

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    // should not set a session cookie
    expect(login.header["set-cookie"]).toBeUndefined();

    // should redirect to /login with error message
    expect(login.status).toBe(302);
    const redirect = login.header.location;
    expect(redirect).toContain(`http://${UI_HOST}/login`);
    expect(redirect).toContain(
      queryString.escape(loginError.NOT_ACTIVATED.message)
    );
  });

  it("should not authenticate a user if password is invalid", async () => {
    const user = await userFactory();

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=invalid`);

    // should not set a session cookie
    expect(login.header["set-cookie"]).toBeUndefined();

    // should redirect to /login with error message
    expect(login.status).toBe(302);
    const redirect = login.header.location;
    expect(redirect).toContain(`http://${UI_HOST}/login`);
    expect(redirect).toContain(
      queryString.escape(loginError.INVALID_PASSWORD.message)
    );
    expect(redirect).toContain(
      queryString.escape(loginError.INVALID_PASSWORD.errorField)
    );
  });

  it(`should not take into account a session cookie
      from a different environment on the same subdomain`, async () => {
    // We had a bug in the sandbox environment where the cookie from production
    // was taken into account causing authentication to fail. The fix was to set
    // an explicit cookie name
    // Cf https://github.com/expressjs/session#name
    // Using default cookie name will cause this test to fail

    const OLD_ENV = process.env;
    process.env.SESSION_NAME = "sandbox.trackdechets.connect.sid";
    process.env.SESSION_COOKIE_HOST = "sandbox.trackdechets.beta.gouv.fr";

    // re-load variables with custom env
    jest.resetModules();
    const a = require("../server").app;
    const s = require("../server").sess;
    const r = supertest(a);

    const user = await userFactory();

    const login = await r
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    // should send sandbox.trackdechets.connect.sid cookie
    expect(login.header["set-cookie"]).toHaveLength(1);
    const cookieRegExp = new RegExp(
      `${s.name}=(.+); Domain=${s.cookie.domain}; Path=/; Expires=.+; HttpOnly`
    );
    const sessionCookie = login.header["set-cookie"][0];
    expect(sessionCookie).toMatch(cookieRegExp);

    const cookieValue = sessionCookie.match(cookieRegExp)[1];

    // send both cookies
    const res = await r
      .post("/")
      .send({ query: "{ me { email } }" })
      .set(
        "Cookie",
        [
          "trackdechets.connect.sid=s%3Ax88pByFASxf",
          `${s.name}=${cookieValue}`
        ].join(";")
      );

    expect(res.body.data).toEqual({
      me: { email: user.email }
    });

    process.env = OLD_ENV;
  });
});

describe("POST /logout", () => {
  it("should expire session cookie", async () => {
    const logout = await request.post("/logout");
    expect(logout.header["set-cookie"]).toHaveLength(1);
    const cookieHeader = logout.header["set-cookie"][0];
    expect(cookieHeader).toEqual(
      `${sess.name}=; Domain=${UI_HOST}; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    );
  });
});

describe("Authentification with token", () => {
  afterEach(() => resetDatabase());

  it("should deny access to unauthenticated requests", async () => {
    const res = await request.post("/").send({ query: "{ me { email } }" });
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toEqual("Vous n'êtes pas connecté.");
    expect(res.body.data).toBeNull();
  });

  it("should authenticate using JWT token", async () => {
    const user = await userFactory();

    const token = sign({ userId: user.id }, JWT_SECRET);

    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data).toEqual({
      me: { email: user.email }
    });

    // should create a new access token to make it revokable
    // next time this token is used, it will use passport bearer strategy
    const accessToken = await prisma.accessToken({ token });
    expect(accessToken).toBeDefined();
    expect(accessToken.token).toEqual(token);
    expect(accessToken.lastUsed).not.toBeNull();
    const accessTokenUser = await prisma.accessToken({ token }).user();
    expect(accessTokenUser.id).toEqual(user.id);
  });

  it("should authenticate using OAuth2 bearer token", async () => {
    const user = await userFactory();

    const token = getUid(10);
    await prisma.createAccessToken({
      token,
      user: { connect: { id: user.id } }
    });

    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data).toEqual({
      me: { email: user.email }
    });

    // should update lastUsed field
    const accessToken = await prisma.accessToken({ token });
    expect(accessToken.lastUsed).not.toBeNull();
  });
});
