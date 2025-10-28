import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { compare } from "bcrypt";
import { AuthType } from "../../../../auth/auth";
import type { Mutation } from "@td/codegen-back";
import { ErrorCode } from "../../../../common/errors";

const CHANGE_PASSWORD = `
  mutation ChangePassword($oldPassword: String!, $newPassword: String!){
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword){
      id
    }
  }
`;

describe("mutation changePassword", () => {
  afterAll(resetDatabase);

  it("should update a user password", async () => {
    const user = await userFactory();

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const newPassword = "Trackdechets1#";
    const { data } = await mutate<Pick<Mutation, "changePassword">>(
      CHANGE_PASSWORD,
      {
        variables: { oldPassword: "pass", newPassword }
      }
    );
    expect(data.changePassword.id).toEqual(user.id);
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(await compare(newPassword, updatedUser.password)).toEqual(true);
  });

  it("should deny short password", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const newPassword = "toto#";
    const { errors } = await mutate<Pick<Mutation, "changePassword">>(
      CHANGE_PASSWORD,
      {
        variables: { oldPassword: "pass", newPassword }
      }
    );
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should deny weak password", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const newPassword = "aaaaaaaaaaa";
    const { errors } = await mutate<Pick<Mutation, "changePassword">>(
      CHANGE_PASSWORD,
      {
        variables: { oldPassword: "pass", newPassword }
      }
    );
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });
  it("should deny long password", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const newPassword =
      "Lorem-ipsum-dolor-sit-amet-consectetur-adipiscing-elit-Ut-volutpat";
    const { errors } = await mutate<Pick<Mutation, "changePassword">>(
      CHANGE_PASSWORD,
      {
        variables: { oldPassword: "pass", newPassword }
      }
    );
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should invalidate all user reset password hashes", async () => {
    const user = await userFactory();
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const oldPassword = "pass";
    const newPassword = "New-pass-123$";

    // Create a user reset password hash
    await prisma.userResetPasswordHash.create({
      data: { userId: user.id, hash: "HASH", hashExpires: new Date() }
    });

    // Change the password
    const { data, errors } = await mutate<Pick<Mutation, "changePassword">>(
      CHANGE_PASSWORD,
      {
        variables: { oldPassword, newPassword }
      }
    );
    expect(errors).toBeUndefined();
    expect(data.changePassword.id).toEqual(user.id);
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });
    expect(await compare(newPassword, updatedUser.password)).toEqual(true);

    // Password reset hash should have been deleted
    const hashes = await prisma.userResetPasswordHash.findMany({
      where: { userId: user.id }
    });
    expect(hashes.length).toEqual(0);
  });
});
