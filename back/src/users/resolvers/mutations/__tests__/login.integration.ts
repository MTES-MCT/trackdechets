import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import prisma from "../../../../prisma";
import { hashToken } from "../../../../utils";
import { Mutation } from "../../../../generated/graphql/types";
describe("{ mutation { login } }", () => {
  it("should return a token", async () => {
    const user = await userFactory();
    const { mutate } = makeClient(user);

    const mutation = `
      mutation {
        login(email: "${user.email}", password: "pass"){
          token
        }
      }
    `;
    const { data } = await mutate<Pick<Mutation, "login">>(mutation);

    expect(data.login.token).toHaveLength(40);
    // should have created an accessToken in db
    const accessToken = await prisma.accessToken.findUnique({
      where: {
        token: hashToken(data.login.token)
      }
    });
    expect(accessToken).not.toBeNull();
    expect(accessToken.token).toEqual(hashToken(data.login.token));
  });
});
