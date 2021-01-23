import { ExecutionResult } from "graphql";
import {
  applicationFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { AuthType } from "../../../../auth";
import { Query } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { createAccessToken, toAccessToken } from "../../../database";
import { getUid } from "../../../../utils";

const GET_PERSONAL_ACCESS_TOKENS = `
  query GetPersonalAccessTokens {
    personalAccessTokens {
      id
      token
      lastUsed
    }
  }
`;

describe("Query.personalAccessTokens", () => {
  afterEach(resetDatabase);

  it("should return personal access tokens", async () => {
    const user = await userFactory();
    const personalAccessToken = await createAccessToken(user);

    // application's access tokens must not be returned
    const application = await applicationFactory();
    await prisma.accessToken.create({
      data: {
        user: {
          connect: { id: user.id }
        },
        application: {
          connect: {
            id: application.id
          }
        },
        token: getUid(40)
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<
      ExecutionResult<Pick<Query, "personalAccessTokens">>
    >(GET_PERSONAL_ACCESS_TOKENS);

    expect(data.personalAccessTokens).toEqual([
      toAccessToken(personalAccessToken)
    ]);
  });
});
