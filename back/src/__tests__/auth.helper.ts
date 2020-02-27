import { Express } from "express";
import supertest = require("supertest");

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
