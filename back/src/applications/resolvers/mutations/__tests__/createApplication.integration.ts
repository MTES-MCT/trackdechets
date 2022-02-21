import { gql } from "apollo-server-core";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateApplicationArgs
} from "../../../../generated/graphql/types";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_APPLICATION = gql`
  mutation CreateApplication($input: ApplicationInput!) {
    createApplication(input: $input) {
      id
      clientSecret
    }
  }
`;

describe("createApplication", () => {
  afterEach(resetDatabase);

  it.skip("should create an application", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);

    const { data } = await mutate<
      Pick<Mutation, "createApplication">,
      MutationCreateApplicationArgs
    >(CREATE_APPLICATION, {
      variables: {
        input: {
          name: "Acme",
          logoUrl: "https://acme.com/logo.png",
          redirectUris: [
            "http://localhost:3000/callback",
            "https://acme.com/callback"
          ],
          goal: "CLIENTS"
        }
      }
    });

    expect(data.createApplication).toMatchObject({
      id: expect.any(String),
      clientSecret: expect.any(String)
    });
  });
});
