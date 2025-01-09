import supertest from "supertest";
import { app, sess } from "../server";
import { userFactory } from "./factories";
import { resetDatabase } from "../../integration-tests/helper";

import { redisClient } from "../common/redis";
import { getLoginError } from "../auth";
import { setCaptchaToken, getCaptchaToken } from "../common/redis/captcha";
import queryString from "querystring";

const { UI_HOST } = process.env;
const request = supertest(app);
const loginError = getLoginError("Some User");

describe("Captcha endpoint", () => {
  it("should return a captcha response", async () => {
    const response = await request.get("/captcha");
    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        img: expect.any(String),
        token: expect.any(String)
      })
    );
  });
});

describe("Captcha audio alternative", () => {
  it("should return a captcha audio alternative", async () => {
    const captchaToken = "audio123";
    const captcha = "AX";
    await setCaptchaToken(captchaToken, captcha);
    const response = await request.get(`/captcha-audio/${captchaToken}`);

    expect(response.status).toEqual(200);
    expect(response.body.playList).toEqual([0, 1]);
    expect(response.body.audio.length).toEqual(2);
    // check response base64 audios items begin with appropriate strings
    expect(
      response.body.audio[0].startsWith(
        "//NAxAAQeIosp0ZIAIHABe/xEZZAhD3v9kEMPBwGA0wQ"
      )
    ).toBe(true);
    expect(
      response.body.audio[1].startsWith(
        "//NAxAAT+eJ4U1gQAA1gAyg7zsgLgFkCzCPj8pfmIQCIg"
      )
    ).toBe(true);
  });
});
describe("POST /login", () => {
  afterEach(() => resetDatabase());

  it("should not authenticate if captcha input and token are missing", async () => {
    const user = await userFactory();
    const key = `user-login-failed:${user.email}`;

    await redisClient.set(key, 5); // simulates 5 failed logint attempts

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`);

    // should not set a session cookie
    expect(login.header["set-cookie"]).toBeUndefined();

    // should redirect to /
    expect(login.status).toBe(302);
    const redirect = login.header.location;
    expect(redirect).toContain(`http://${UI_HOST}/login`);
    expect(redirect).toContain(
      queryString.escape(loginError.INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA.code)
    );
    await redisClient.unlink(key); // cleanup
  });

  it("should not authenticate if captcha input is missing", async () => {
    const user = await userFactory();
    const key = `user-login-failed:${user.email}`;

    await redisClient.set(key, 5); // simulates 5 failed logint attempts

    const captchaToken = "xyz987";
    const captcha = "TD1234";
    await setCaptchaToken(captchaToken, captcha);

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`)
      .send(`captchaToken=${captchaToken}`); // missing input

    // should not set a session cookie
    expect(login.header["set-cookie"]).toBeUndefined();

    // should redirect to /login
    expect(login.status).toBe(302);
    const redirect = login.header.location;
    expect(redirect).toContain(`http://${UI_HOST}/login`);
    expect(redirect).toContain(
      queryString.escape(loginError.INVALID_USER_OR_PASSWORD_NEEDS_CAPTCHA.code)
    );

    await redisClient.unlink(key); // cleanup
  });

  it("should not authenticate if captcha input is wrong", async () => {
    const user = await userFactory();
    const key = `user-login-failed:${user.email}`;

    await redisClient.set(key, 5); // simulates 5 failed logint attempts

    const captchaToken = "xyz987";
    const captcha = "TD1234";
    await setCaptchaToken(captchaToken, captcha);

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`)
      .send(`captchaInput=abcdef`) // wrong captcha
      .send(`captchaToken=${captchaToken}`);

    // should not set a session cookie
    expect(login.header["set-cookie"]).toBeUndefined();

    // should redirect to /
    expect(login.status).toBe(302);
    const redirect = login.header.location;
    expect(redirect).toContain(`http://${UI_HOST}/login`);
    expect(redirect).toContain(
      queryString.escape(loginError.INVALID_CAPTCHA.code)
    );
    const redisToken = await getCaptchaToken(captchaToken);
    expect(redisToken).toBeFalsy();
    await redisClient.unlink(key); // cleanup
  });

  it("should increment redis value after each failed login attempt", async () => {
    const user = await userFactory();
    const key = `user-login-failed:${user.email}`;
    await redisClient.unlink(key); // cleanup
    await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=invalid`);

    const redisValueAfterFirstFail = await redisClient.get(key);
    expect(redisValueAfterFirstFail).toEqual("1");

    await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=invalid`);

    const redisValueAfterSecondFail = await redisClient.get(key);
    expect(redisValueAfterSecondFail).toEqual("2");
    await redisClient.unlink(key); // cleanup
  });

  it("create a persistent session if login form and captcha are valid", async () => {
    const user = await userFactory();
    const key = `user-login-failed:${user.email}`;
    await redisClient.set(key, 5); // simulates 5 failed logint attempts

    const token = "xyz987";
    const captcha = "TD1234";
    await setCaptchaToken(token, captcha);

    const login = await request
      .post("/login")
      .send(`email=${user.email}`)
      .send(`password=pass`)
      .send(`captchaInput=${captcha}`)
      .send(`captchaToken=${token}`);

    // should send trackdechets.connect.sid cookie
    expect(login.header["set-cookie"]).toHaveLength(1);
    const cookieRegExp = new RegExp(
      `${sess.name}=(.+); Domain=${
        sess.cookie!.domain
      }; Path=/; Expires=.+; HttpOnly`
    );
    const sessionCookie = login.header["set-cookie"][0];
    expect(sessionCookie).toMatch(cookieRegExp);

    // should redirect to /
    expect(login.status).toBe(302);
    expect(login.header.location).toBe(`http://${UI_HOST}/dashboard`);

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
});
