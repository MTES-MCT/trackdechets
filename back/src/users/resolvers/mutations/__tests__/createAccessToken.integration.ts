import { gql } from "graphql-tag";
import {
  Mutation,
  MutationCreateAccessTokenArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { hashToken } from "../../../../utils";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_ACCESS_TOKEN = gql`
  mutation CreateAccessToken($input: CreateAccessTokenInput!) {
    createAccessToken(input: $input) {
      id
      token
      description
    }
  }
`;

describe("mutation createAccessToken", () => {
  it("should create an access token and return its value", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "createAccessToken">,
      MutationCreateAccessTokenArgs
    >(CREATE_ACCESS_TOKEN, {
      variables: { input: { description: "TEST" } }
    });
    const accessToken = await prisma.accessToken.findFirstOrThrow({
      where: { id: data.createAccessToken.id }
    });
    expect(accessToken).not.toBeNull();
    expect(accessToken.userId).toEqual(user.id);
    expect(accessToken.isRevoked).toEqual(false);
    // check the clear token is sent
    expect(hashToken(data.createAccessToken.token)).toEqual(accessToken.token);
  });
});
