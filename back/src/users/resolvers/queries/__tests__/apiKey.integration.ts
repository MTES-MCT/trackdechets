import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "../../../../generated/prisma-client";
import { AuthType } from "../../../../auth";
import { Query } from "../../../../generated/graphql/types";
import { ExecutionResult } from "graphql";

describe("{ query { apiKey } }", () => {
  afterAll(() => resetDatabase());

  it("should return an api key", async () => {
    const user = await userFactory();
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<ExecutionResult<Pick<Query, "apiKey">>>(
      "query { apiKey }"
    );
    expect(data.apiKey).toHaveLength(40);
    // should have created an accessToken in db
    const accessToken = await prisma.accessToken({
      token: data.apiKey
    });
    expect(accessToken).not.toBeNull();
  });
});
