import { Express } from "express";
import supertest from "supertest";

export async function logIn(
  app: Express,
  email: string,
  password: string
): Promise<{ sessionCookie: string }> {
  const request = supertest(app);

  const login = await request
    .post("/login")
    .send(`email=${email}`)
    .send(`password=${password}`);

  const setCookie = login.header["set-cookie"];
  if (setCookie.length === 0) {
    throw Error("Not Authorized");
  }

  return { sessionCookie: setCookie[0] };
}

export async function secondFactor(
  app: Express,
  totp: string,
  prelogCookie: string
): Promise<{ sessionCookie: string }> {
  const request = supertest(app);

  const login = await request
    .post("/otp")
    .send(`totp=${totp}`)
    .set("Cookie", prelogCookie);

  const setCookie = login.header["set-cookie"];

  if (setCookie.length === 0) {
    throw Error("Not Authorized");
  }

  return { sessionCookie: setCookie[0] };
}
