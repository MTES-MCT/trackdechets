import { gql } from "graphql-tag";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Mutation, MutationRevokeAccessTokenArgs } from "@td/codegen-back";

const REVOKE_ACCESS_TOKEN = gql`
  mutation RevokeAccessToken($id: ID!) {
    revokeAccessToken(id: $id) {
      id
    }
  }
`;

describe("mutation revokeAccessToken", () => {
  afterAll(resetDatabase);

  it("should mark an accessToken as revoked", async () => {
    const user = await userFactory();
    const accessToken = await prisma.accessToken.create({
      data: { userId: user.id, token: "token1" }
    });
    expect(accessToken.isRevoked).toEqual(false);
    const { mutate } = makeClient(user);
    await mutate(REVOKE_ACCESS_TOKEN, { variables: { id: accessToken.id } });
    const revokedAccessToken = await prisma.accessToken.findFirstOrThrow({
      where: { id: accessToken.id }
    });
    expect(revokedAccessToken.isRevoked).toEqual(true);
  });

  it("should not be possible to revoke another user's access token", async () => {
    const user = await userFactory();
    const someoneElse = await userFactory();
    const accessToken = await prisma.accessToken.create({
      data: { userId: someoneElse.id, token: "token2" }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "revokeAccessToken">,
      MutationRevokeAccessTokenArgs
    >(REVOKE_ACCESS_TOKEN, {
      variables: { id: accessToken.id }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'avez pas le droit de supprimer ce jeton d'accès"
      })
    ]);
  });
});
