import { resetDatabase } from "../../integration-tests/helper";
import * as supertest from "supertest";
import { app } from "../server";
import { prisma } from "../generated/prisma-client";
import { hashPassword } from "../users/utils";
import { loginError } from "../auth";
import * as queryString from "querystring";
import { sign } from "jsonwebtoken";
import { getUid } from "../utils";

const { UI_HOST, JWT_SECRET } = process.env;

const request = supertest(app);

describe("POST /login", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("create a persistent session if login form is valid", async () => {
    const user = await prisma.createUser({
      name: "John Snow",
      email: "john.snow@trackdechets.fr",
      password: await hashPassword("winter-is-coming"),
      isActive: true
    });

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=winter-is-coming`);

    // should send connect.sid cookie
    expect(login.header["set-cookie"]).toHaveLength(1);
    const cookieRegExp = new RegExp(
      `connect.sid=.+; Domain=${UI_HOST}; Path=/; Expires=.+; HttpOnly`
    );
    const sessionCookie = login.header["set-cookie"][0];
    expect(sessionCookie).toMatch(cookieRegExp);

    // should redirect to /dashboard/slips
    expect(login.status).toBe(302);
    expect(login.header.location).toBe(`http://${UI_HOST}/dashboard/slips`);

    // should persist user across requests
    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Cookie", sessionCookie);

    expect(res.body.data).toEqual({
      me: { email: "john.snow@trackdechets.fr" }
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
    expect(redirect).toContain(queryString.escape(loginError.UNKNOWN_USER));
  });

  it("should not authenticate a user whose email has not been validated", async () => {
    const user = await prisma.createUser({
      name: "John Snow",
      email: "john.snow@trackdechets.fr",
      password: await hashPassword("winter-is-coming"),
      isActive: false
    });

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=winter-is-coming`);

    // should not set a session cookie
    expect(login.header["set-cookie"]).toBeUndefined();

    // should redirect to /login with error message
    expect(login.status).toBe(302);
    const redirect = login.header.location;
    expect(redirect).toContain(`http://${UI_HOST}/login`);
    expect(redirect).toContain(queryString.escape(loginError.NOT_ACTIVATED));
  });

  it("should not authenticate a user if password is invalid", async () => {
    const user = await prisma.createUser({
      name: "John Snow",
      email: "john.snow@trackdechets.fr",
      password: await hashPassword("winter-is-coming"),
      isActive: true
    });

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
    expect(redirect).toContain(queryString.escape(loginError.INVALID_PASSWORD));
  });
});

describe("POST /logout", () => {
  it("should expire session cookie", async () => {
    const logout = await request.post("/logout");
    expect(logout.header["set-cookie"]).toHaveLength(1);
    const cookieHeader = logout.header["set-cookie"][0];
    expect(cookieHeader).toEqual(
      `connect.sid=; Domain=${UI_HOST}; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    );
  });
});

describe("Authentification with token", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should deny access to unauthenticated requests", async () => {
    const res = await request.post("/").send({ query: "{ me { email } }" });
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].message).toEqual("Vous n'êtes pas connecté.");
    expect(res.body.data.me).toBeNull();
  });

  it("should authenticate using JWT token", async () => {
    const user = await prisma.createUser({
      name: "John Snow",
      email: "john.snow@trackdechets.fr",
      password: await hashPassword("winter-is-coming"),
      isActive: true
    });

    const token = sign({ userId: user.id }, JWT_SECRET);

    const res = await request
      .post("/")
      .send({ query: "{ me { email } }" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.data).toEqual({
      me: { email: "john.snow@trackdechets.fr" }
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
    const user = await prisma.createUser({
      name: "John Snow",
      email: "john.snow@trackdechets.fr",
      password: await hashPassword("winter-is-coming"),
      isActive: true
    });

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
      me: { email: "john.snow@trackdechets.fr" }
    });

    // should update lastUsed field
    const accessToken = await prisma.accessToken({ token });
    expect(accessToken.lastUsed).not.toBeNull();
  });
});
