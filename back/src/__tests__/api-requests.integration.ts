import { sign } from "jsonwebtoken";
import axios from "axios";

import { resetDatabase } from "../../integration-tests/helper";
import { server } from "../server";
import { createTestClient } from "apollo-server-testing";
import { userFactory } from "./factories";

const { JWT_SECRET } = process.env;

describe("Perform api requests", () => {
  afterAll(async () => {
    await resetDatabase();
  });

  test("query request with application/json header", async () => {
    const user = await userFactory();

    const token = sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1d" });

    const res = await axios({
      method: "POST",
      url: "http://td-api/account/api",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: {
        query: "{   me {    id   email } } "
      }
    });

    expect(res.data.data.me.email).toEqual(user.email);
  });

  test("query request with application/graphql header", async () => {
    const user2 = await userFactory();

    const token = sign({ userId: user2.id }, JWT_SECRET, { expiresIn: "1d" });

    const res = await axios({
      method: "POST",
      url: "http://td-api/account/api",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/graphql"
      },
      data: "{   me {     id   email  } } "
    });

    expect(res.data.data.me.email).toEqual(user2.email);
  });
});
