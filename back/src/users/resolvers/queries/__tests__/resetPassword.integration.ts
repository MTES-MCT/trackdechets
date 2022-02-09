import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { userFactory } from "../../../../__tests__/factories";
import { Query } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";

const RESET_PASSWORD = `
  query ResetPassword($hash: String!) {
    resetPassword(hash: $hash)  
  }
`;

describe("resetPassword", () => {
  afterEach(resetDatabase);

  it("querying a valid hash", async () => {
    const user = await userFactory();

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: new Date(Date.now() + 3600 * 60),
        user: { connect: { id: user.id } }
      }
    });
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "resetPassword">>(RESET_PASSWORD, {
      variables: { hash: "abcdef" }
    });
    expect(data.resetPassword).toEqual(true);
  });

  it("querying an inexistant hash", async () => {
    const user = await userFactory();

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: new Date(Date.now() + 3600 * 60),
        user: { connect: { id: user.id } }
      }
    });
    const { query } = makeClient();
    const { data } = await query<Pick<Query, "resetPassword">>(RESET_PASSWORD, {
      variables: { hash: "xyz" }
    });
    expect(data.resetPassword).toEqual(false);
  });

  it("querying an expired hash", async () => {
    const user = await userFactory();

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: new Date(Date.now() - 1),
        user: { connect: { id: user.id } }
      }
    });
    const { query } = makeClient();
    const { data } = await query<Pick<Query, "resetPassword">>(RESET_PASSWORD, {
      variables: { hash: "abcdef" }
    });
    expect(data.resetPassword).toEqual(false);
  });
});
