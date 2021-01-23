import { ExecutionResult } from "graphql";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { AuthType } from "../../../../auth";
import { Mutation } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { createAccessToken } from "../../../database";

const REVOKE_PERSONAL_ACCESS_TOKEN = `
  mutation RevokePersonalAccessToken($id: ID!) {
    revokePersonalAccessToken(id: $id) {
      id
      token
      lastUsed
    }
  }
`;

describe("Mutation.revokePersonalAccessToken", () => {
  afterEach(resetDatabase);

  it("should revoke a personal access token", async () => {
    const user = await userFactory();
    const accessToken = await createAccessToken(user);

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await mutate<
      ExecutionResult<Pick<Mutation, "revokePersonalAccessToken">>
    >(REVOKE_PERSONAL_ACCESS_TOKEN, {
      variables: {
        id: accessToken.id
      }
    });

    const deletedAccessToken = await prisma.accessToken.findUnique({
      where: {
        id: data.revokePersonalAccessToken.id
      }
    });

    expect(deletedAccessToken.isRevoked).toBe(true);
  });

  it("should deny revoking someone else's personal access token", async () => {
    const user = await userFactory();
    const otherUser = await userFactory();
    const accessToken = await createAccessToken(otherUser);

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<
      ExecutionResult<Pick<Mutation, "revokePersonalAccessToken">>
    >(REVOKE_PERSONAL_ACCESS_TOKEN, {
      variables: {
        id: accessToken.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cette clé d'API n'existe pas."
      })
    ]);
  });
});
