import queryString from "querystring";
import supertest from "supertest";
import { resetDatabase } from "../../integration-tests/helper";
import { getLoginError } from "../auth/auth";
import { prisma } from "@td/prisma";
import { app, sess } from "../server";
import { getUid, hashToken } from "../utils";
import { userFactory, userWithAccessTokenFactory } from "./factories";
import { TOTP } from "totp-generator";
import { clearUserLoginNeedsCaptcha } from "../common/redis/captcha";
import { addSeconds } from "date-fns";

const { UI_HOST } = process.env;

const request = supertest(app);
const loginError = getLoginError("Some User");

const cookieRegExp = new RegExp(
  `${sess.name}=(.+); Domain=${
    sess.cookie!.domain
  }; Path=/; Expires=.+; HttpOnly; SameSite=Lax`
);

describe("POST /login", () => {
  beforeEach(() => clearUserLoginNeedsCaptcha("user_1@td.io"));

  afterEach(async () => resetDatabase());

  it("create a persistent session if login form is valid", async () => {
    const user = await userFactory();

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    // should send trackdechets.connect.sid cookie
    expect(login.header["set-cookie"]).toHaveLength(1);

    const sessionCookie = login.header["set-cookie"][0];
    expect(sessionCookie).toMatch(cookieRegExp);

    // should redirect to /
    expect(login.status).toBe(302);
    expect(login.header.location).toBe(`http://${UI_HOST}/`);

    const cookieValue = sessionCookie.match(cookieRegExp)?.[1];

    // should persist user across requests
    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", `${sess.name}=${cookieValue}`);

    expect(res.body.data).toEqual({
      me: { email: user.email }
    });
  });

  it("should authenticate user regardless of their email's casing", async () => {
    const user = await userFactory();

    const login = await request
      .post("/login")
      .send(`email=${user.email.toUpperCase()}`)
      .send(`password=pass`);

    expect(login.header["set-cookie"]).toHaveLength(1);
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
      queryString.escape(loginError.INVALID_USER_OR_PASSWORD.code)
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
      queryString.escape(loginError.NOT_ACTIVATED.code)
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
      queryString.escape(loginError.INVALID_USER_OR_PASSWORD.code)
    );
  });

  it("should not authenticate a user whose email has not been validated with the wrong password", async () => {
    const user = await userFactory({ isActive: false });

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
      queryString.escape(loginError.INVALID_USER_OR_PASSWORD.code)
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
    const startApolloServer = require("../server").startApolloServer;
    await startApolloServer();
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

    const cookieValue = sessionCookie.match(cookieRegExp)?.[1];

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
  }, 10000);

  it("should not authenticate with invalid password if connected user is not admin", async () => {
    const nonAdmin = await userFactory({ isAdmin: false });

    // Login as non-admin user
    const nonAdminLogin = await request
      .post("/login")
      .send(`email=${nonAdmin.email.toUpperCase()}`)
      .send(`password=pass`);

    // Then login as someone else (req.user is not null)
    const user = await userFactory();
    const login = await request
      .post("/login")
      .set("Cookie", nonAdminLogin.header["set-cookie"])
      .send(`email=${user.email.toUpperCase()}`)
      .send(`password=invalidPwd`);

    // should not set a new session cookie
    // but as sessions are rolling, we should keep the previous one
    const sessionCookie = nonAdminLogin.header["set-cookie"][0];
    const cookieValue = sessionCookie.match(cookieRegExp)?.[1];
    expect(login.header["set-cookie"][0]).toContain(cookieValue);

    // should redirect to /login with error message
    expect(login.status).toBe(302);
    const redirect = login.header.location;
    expect(redirect).toContain(`http://${UI_HOST}/login`);
    expect(redirect).toContain(
      queryString.escape(loginError.INVALID_USER_OR_PASSWORD.code)
    );
  });
});

describe("Second factor", () => {
  it("redirect to second factor page if user has totp activated", async () => {
    const user = await userFactory({
      totpSeed: "A",
      totpActivatedAt: new Date()
    });

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    // should send trackdechets.connect.sid cookie
    expect(login.header["set-cookie"]).toHaveLength(1);

    const sessionCookie = login.header["set-cookie"][0];
    expect(sessionCookie).toMatch(cookieRegExp);

    // should redirect to /
    expect(login.status).toBe(302);
    expect(login.header.location).toBe(`http://${UI_HOST}/second-factor`);

    const cookieValue = sessionCookie.match(cookieRegExp)?.[1];

    // the user is not authenticated yet
    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", `${sess.name}=${cookieValue}`);
    const { data, errors } = res.body;
    expect(data).toEqual(null);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("should log the user in with second factor", async () => {
    const totpSeed = "ABCD";
    const user = await userFactory({ totpSeed, totpActivatedAt: new Date() });

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    // should send trackdechets.connect.sid cookie
    expect(login.header["set-cookie"]).toHaveLength(1);

    const sessionCookie = login.header["set-cookie"][0];
    const cookieValue = sessionCookie.match(cookieRegExp)?.[1];

    const { otp } = TOTP.generate(totpSeed);
    const secondFactor = await request
      .post("/otp")
      .send(`totp=${otp}`)
      .send(`password=pass`)
      .set("Cookie", `${sess.name}=${cookieValue}`);

    // should redirect to /
    expect(secondFactor.status).toBe(302);
    expect(secondFactor.header.location).toBe(`http://${UI_HOST}/`);

    const otpSessionCookie = secondFactor.header["set-cookie"][0];
    const otpCookieValue2 = otpSessionCookie.match(cookieRegExp)?.[1];

    // should persist user across requests
    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", `${sess.name}=${otpCookieValue2}`);

    expect(res.body.data).toEqual({
      me: { email: user.email }
    });
  });

  it("should deny user when otp is wrong", async () => {
    const totpSeed = "ABCD";
    const user = await userFactory({ totpSeed, totpActivatedAt: new Date() });

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    // should send trackdechets.connect.sid cookie
    expect(login.header["set-cookie"]).toHaveLength(1);

    const sessionCookie = login.header["set-cookie"][0];
    const cookieValue = sessionCookie.match(cookieRegExp)?.[1];
    const timestamp = new Date();
    const secondFactor = await request
      .post("/otp")
      .send(`totp=XYZ`) // wrong otp
      .send(`password=pass`)
      .set("Cookie", `${sess.name}=${cookieValue}`);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // should redirect
    expect(secondFactor.status).toBe(302);
    expect(secondFactor.header.location).toBe(
      `http://${UI_HOST}/second-factor?errorCode=INVALID_TOTP&lockout=${updatedUser?.totpLockedUntil?.getTime()}`
    );
    // rolling session cookie should be kept
    expect(secondFactor.header["set-cookie"][0]).toContain(cookieValue);

    // the user is not authenticated yet
    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", `${sess.name}=${cookieValue}`);
    const { data, errors } = res.body;
    expect(data).toEqual(null);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");

    expect(updatedUser!.totpFails).toEqual(1);

    // totpLockedUntil is incremented by 5s steps (5000ms)
    expect(
      updatedUser!.totpLockedUntil!.getTime() - timestamp.getTime() >= 5 * 1000
    ).toBe(true);
  });

  it("should increase lockout when otp is wrong", async () => {
    const totpSeed = "ABCD";
    const user = await userFactory({
      totpSeed,
      totpActivatedAt: new Date(),
      totpFails: 1,
      totpLockedUntil: new Date()
    });

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    const sessionCookie = login.header["set-cookie"][0];
    const cookieValue = sessionCookie.match(cookieRegExp)?.[1];
    const timestamp = new Date();
    const secondFactor = await request
      .post("/otp")
      .send(`totp=XYZ`) // wrong otp
      .send(`password=pass`)
      .set("Cookie", `${sess.name}=${cookieValue}`);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    expect(secondFactor.header.location).toBe(
      `http://${UI_HOST}/second-factor?errorCode=INVALID_TOTP&lockout=${updatedUser?.totpLockedUntil?.getTime()}`
    );

    expect(updatedUser!.totpFails).toEqual(2); // updated fails count

    // updated totpLockedUntil is incremented (2 * 5s)
    expect(
      updatedUser!.totpLockedUntil!.getTime() - timestamp.getTime() >=
        2 * 5 * 1000
    ).toBe(true);
  });

  it("should ignore totp during lockout", async () => {
    const totpSeed = "ABCD";

    const totpLockedUntil = addSeconds(new Date(), 5);
    const user = await userFactory({
      totpSeed,
      totpActivatedAt: new Date(),
      totpFails: 1,
      totpLockedUntil
    });

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    const sessionCookie = login.header["set-cookie"][0];
    const cookieValue = sessionCookie.match(cookieRegExp)?.[1];

    const { otp } = TOTP.generate(totpSeed);
    const secondFactor = await request
      .post("/otp")
      .send(`totp=${otp}`) // wrong otp
      .send(`password=pass`)
      .set("Cookie", `${sess.name}=${cookieValue}`);

    expect(secondFactor.header.location).toBe(
      `http://${UI_HOST}/second-factor?errorCode=TOTP_LOCKOUT&lockout=${totpLockedUntil.getTime()}` // matches totpLockedUntil 5 seconds
    );
  });

  it("should reset lockout when totp is successfully submitted", async () => {
    const totpSeed = "ABCD";

    const user = await userFactory({
      totpSeed,
      totpActivatedAt: new Date(),
      totpFails: 1,
      totpLockedUntil: new Date() // lockout expired
    });

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    const sessionCookie = login.header["set-cookie"][0];
    const cookieValue = sessionCookie.match(cookieRegExp)?.[1];

    const { otp } = TOTP.generate(totpSeed);
    const secondFactor = await request
      .post("/otp")
      .send(`totp=${otp}`) // wrong otp
      .send(`password=pass`)
      .set("Cookie", `${sess.name}=${cookieValue}`);

    // should redirect to /
    expect(secondFactor.status).toBe(302);
    expect(secondFactor.header.location).toBe(`http://${UI_HOST}/`);
    const otpSessionCookie = secondFactor.header["set-cookie"][0];
    const otpCookieValue2 = otpSessionCookie.match(cookieRegExp)?.[1];

    // user is fully logged
    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", `${sess.name}=${otpCookieValue2}`);

    expect(res.body.data).toEqual({
      me: { email: user.email }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    expect(updatedUser!.totpFails).toEqual(0); // fails count is reset

    // totpLockedUntil is reset
    expect(updatedUser!.totpLockedUntil).toEqual(null);
  });
});

describe("POST /logout", () => {
  it("should change sessionID", async () => {
    const logout1 = await request.post("/logout");
    expect(logout1.header["set-cookie"]).toHaveLength(1);
    const cookieHeader1 = logout1.header["set-cookie"][0];

    const logout2 = await request.post("/logout");
    expect(logout2.header["set-cookie"]).toHaveLength(1);
    const cookieHeader2 = logout2.header["set-cookie"][0];

    expect(cookieHeader1).not.toEqual(cookieHeader2);
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

  it("should authenticate using hashed token", async () => {
    const { user, accessToken } = await userWithAccessTokenFactory();

    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.body.data).toEqual({
      me: { email: user.email }
    });

    const dbToken = await prisma.accessToken.findUniqueOrThrow({
      where: { token: hashToken(accessToken) }
    });
    expect(dbToken.lastUsed).not.toBeNull();
  });

  it("should not authenticate against previously unHashed token", async () => {
    const user = await userFactory();

    const token = getUid(10);
    // mimicking token generated before hashing routine implementation
    await prisma.accessToken.create({
      data: {
        token: token,
        user: { connect: { id: user.id } }
      }
    });

    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toEqual("Vous n'êtes pas connecté.");
    expect(res.body.data).toBeNull();
  });

  it("should authenticate using OAuth2 bearer token", async () => {
    const user = await userFactory();

    const token = getUid(10);
    await prisma.accessToken.create({
      data: {
        token: hashToken(token),
        user: { connect: { id: user.id } }
      }
    });

    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data).toEqual({
      me: { email: user.email }
    });

    // should update lastUsed field
    const accessToken = await prisma.accessToken.findUniqueOrThrow({
      where: { token: hashToken(token) }
    });
    expect(accessToken.lastUsed).not.toBeNull();
  });
});
