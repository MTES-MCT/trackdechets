import {
  Mutation,
  MutationCreateApplicationArgs
} from "../../../../generated/graphql/types";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_APPLICATION = `
  mutation CreateApplication($input: ApplicationInput!) {
    createApplication(input: $input) {
      id
      clientSecret
    }
  }
`;

describe("createApplication", () => {
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
          logoUrl: "https://acme.com/logo.png",
          redirectUris: [
            "http://localhost:3000/callback",
            "https://acme.com/callback"
          ]
        }
      }
    });

    expect(data.createApplication).toMatchObject({
      id: expect.any(String),
      clientSecret: expect.any(String)
    });
  });

  it("should prevent creating an application if user already has one", async () => {
    const user = await userFactory({
      application: {
        create: {
          clientSecret: "secret",
          name: "Acme",
          logoUrl: "https://acme.com/logo.png",
          redirectUris: ["https://acme.com/callback"]
        }
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
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
          ]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas administrer plus d'une application."
      })
    ]);
  });
});
