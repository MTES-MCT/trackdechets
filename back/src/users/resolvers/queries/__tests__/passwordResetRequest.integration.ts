import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import { userFactory } from "../../../../__tests__/factories";
import type { Query } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { addHours, addMinutes } from "date-fns";
const PASSWORD_RESET_REQUEST = `
  query PasswordResetRequest($hash: String!) {
    passwordResetRequest(hash: $hash)  
  }
`;

describe("passwordResetRequest", () => {
  afterEach(resetDatabase);

  it("querying a valid hash", async () => {
    const user = await userFactory();

    const resetHash = await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: addHours(new Date(), 1),
        user: { connect: { id: user.id } }
      }
    });
    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "passwordResetRequest">>(
      PASSWORD_RESET_REQUEST,
      {
        variables: { hash: "abcdef" }
      }
    );
    expect(data!.passwordResetRequest).toEqual(resetHash.id);
  });

  it("querying an inexistant hash", async () => {
    const user = await userFactory();

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: addHours(new Date(), 1),
        user: { connect: { id: user.id } }
      }
    });
    const { query } = makeClient();
    const { data } = await query<Pick<Query, "passwordResetRequest">>(
      PASSWORD_RESET_REQUEST,
      {
        variables: { hash: "xyz" }
      }
    );
    expect(data!.passwordResetRequest).toEqual(null);
  });

  it("querying an expired hash", async () => {
    const user = await userFactory();

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: addMinutes(new Date(), -1),
        user: { connect: { id: user.id } }
      }
    });
    const { query } = makeClient();
    const { data } = await query<Pick<Query, "passwordResetRequest">>(
      PASSWORD_RESET_REQUEST,
      {
        variables: { hash: "abcdef" }
      }
    );
    expect(data!.passwordResetRequest).toEqual(null);
  });
});
