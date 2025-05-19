import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth/auth";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { hashToken } from "../../../../utils";
import type { Query } from "@td/codegen-back";

describe("{ query { apiKey } }", () => {
  afterAll(() => resetDatabase());

  it("should return an api key", async () => {
    const user = await userFactory();
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "apiKey">>("query { apiKey }");
    expect(data.apiKey).toHaveLength(40);
    // should have created an accessToken in db
    const accessToken = await prisma.accessToken.findUnique({
      where: {
        token: hashToken(data.apiKey)
      }
    });
    expect(accessToken).not.toBeNull();
  });
});
