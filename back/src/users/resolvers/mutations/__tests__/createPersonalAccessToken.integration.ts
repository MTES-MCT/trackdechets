import { ExecutionResult } from "graphql";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { AuthType } from "../../../../auth";
import { Mutation } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { toAccessToken } from "../../../database";

const CREATE_PERSONAL_ACCESS_TOKEN = `
  mutation CreatePersonalAccessToken {
    createPersonalAccessToken {
      id
      token
      lastUsed
    }
  }
`;

describe("Mutation.createPersonalAccessToken", () => {
  afterEach(resetDatabase);

  it("should create a personal access token", async () => {
    const user = await userFactory();

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate<
      ExecutionResult<Pick<Mutation, "createPersonalAccessToken">>
    >(CREATE_PERSONAL_ACCESS_TOKEN);

    const accessToken = await prisma.accessToken.findUnique({
      where: {
        id: data.createPersonalAccessToken.id
      }
    });

    expect(data.createPersonalAccessToken).toEqual(toAccessToken(accessToken));
  });
});
