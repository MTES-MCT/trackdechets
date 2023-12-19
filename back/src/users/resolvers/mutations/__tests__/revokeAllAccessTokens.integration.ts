import { gql } from "graphql-tag";
import {
  applicationFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../../../integration-tests/helper";

const REVOKE_ALL_ACCESS_TOKENS = gql`
  mutation RevokeAllAccessTokens {
    revokeAllAccessTokens {
      id
    }
  }
`;

describe("mutation revokeAllAccessTokens", () => {
  afterAll(resetDatabase);

  it("should mark all user's personnal accessTokens as revoked", async () => {
    const user = await userFactory();
    const someoneElse = await userFactory();
    const application = await applicationFactory();
    // personnal token 1, should be revoked
    let accessToken1 = await prisma.accessToken.create({
      data: { userId: user.id, token: "token1" }
    });
    // personnal token 2, should be revoked
    let accessToken2 = await prisma.accessToken.create({
      data: { userId: user.id, token: "token2" }
    });
    // third party access token, should not be revoked
    let accessToken3 = await prisma.accessToken.create({
      data: { userId: user.id, token: "token3", applicationId: application.id }
    });
    // someone else's access token, should not be revoked
    let accessToken4 = await prisma.accessToken.create({
      data: { userId: someoneElse.id, token: "token4" }
    });
    expect(accessToken1.isRevoked).toEqual(false);
    expect(accessToken2.isRevoked).toEqual(false);
    expect(accessToken3.isRevoked).toEqual(false);
    expect(accessToken4.isRevoked).toEqual(false);
    const { mutate } = makeClient(user);
    await mutate(REVOKE_ALL_ACCESS_TOKENS);
    accessToken1 = await prisma.accessToken.findFirstOrThrow({
      where: { id: accessToken1.id }
    });
    accessToken2 = await prisma.accessToken.findFirstOrThrow({
      where: { id: accessToken2.id }
    });
    accessToken3 = await prisma.accessToken.findFirstOrThrow({
      where: { id: accessToken3.id }
    });
    accessToken4 = await prisma.accessToken.findFirstOrThrow({
      where: { id: accessToken4.id }
    });
    expect(accessToken1.isRevoked).toEqual(true);
    expect(accessToken2.isRevoked).toEqual(true);
    expect(accessToken3.isRevoked).toEqual(false);
    expect(accessToken4.isRevoked).toEqual(false);
  });
});
