import { gql } from "graphql-tag";
import {
  applicationFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationRevokeAccessTokenArgs
} from "../../../../generated/graphql/types";

const REVOKE_AUTHORIZED_APPLICATION = gql`
  mutation RevokeAuthorizedApplication($id: ID!) {
    revokeAuthorizedApplication(id: $id) {
      id
    }
  }
`;

describe("mutation revokeAuthorizedApplication", () => {
  afterAll(resetDatabase);

  it("should mark all user's application accessTokens as revoked", async () => {
    const user = await userFactory();
    const someoneElse = await userFactory();
    const application = await applicationFactory();

    // a first token obtained by the application
    let accessToken1 = await prisma.accessToken.create({
      data: { userId: user.id, token: "token1", applicationId: application.id }
    });
    // a second token obtained by the application
    let accessToken2 = await prisma.accessToken.create({
      data: { userId: user.id, token: "token2", applicationId: application.id }
    });
    // a personnal access token
    let accessToken3 = await prisma.accessToken.create({
      data: { userId: user.id, token: "token3" }
    });
    // another user's token linked to the application
    let accessToken4 = await prisma.accessToken.create({
      data: {
        userId: someoneElse.id,
        token: "token4",
        applicationId: application.id
      }
    });
    expect(accessToken1.isRevoked).toEqual(false);
    expect(accessToken2.isRevoked).toEqual(false);
    expect(accessToken3.isRevoked).toEqual(false);
    expect(accessToken4.isRevoked).toEqual(false);
    const { mutate } = makeClient(user);
    await mutate<
      Pick<Mutation, "revokeAuthorizedApplication">,
      MutationRevokeAccessTokenArgs
    >(REVOKE_AUTHORIZED_APPLICATION, {
      variables: { id: application.id }
    });
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
