import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";

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
    const { data } = await mutate(mutation);
    expect(data.login.token).toHaveLength(40);
    // should have created an accessToken in db
    const accessToken = await prisma.accessToken({
      token: data.login.token
    });
    expect(accessToken).not.toBeNull();
    expect(accessToken.token).toEqual(data.login.token);
  });
});
