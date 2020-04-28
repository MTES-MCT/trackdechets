import { userFactory } from "../../../__tests__/factories";
import makeClient from "../../../__tests__/testClient";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";

describe("{ query { apiKey } }", () => {
  afterAll(() => resetDatabase());

  it("should return an api key", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { data } = await query("query { apiKey }");
    expect(data.apiKey).toHaveLength(40);
    // should have created an accessToken in db
    const accessToken = await prisma.accessToken({
      token: data.apiKey
    });
    expect(accessToken).not.toBeNull();
  });
});
