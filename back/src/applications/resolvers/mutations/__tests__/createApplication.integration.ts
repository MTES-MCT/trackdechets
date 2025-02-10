import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Mutation, MutationCreateApplicationArgs } from "@td/codegen-back";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_APPLICATION = gql`
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      id
      clientSecret
    }
  }
`;

describe("createApplication", () => {
  afterEach(resetDatabase);

  it("should create an application", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);

    const { data } = await mutate<
      Pick<Mutation, "createApplication">,
      MutationCreateApplicationArgs
    >(CREATE_APPLICATION, {
      variables: {
        input: {
          name: "Acme",
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
