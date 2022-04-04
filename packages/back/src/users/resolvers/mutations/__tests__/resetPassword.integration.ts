import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { Mutation } from "@trackdechets/codegen/src/back.gen";
import { compare } from "bcrypt";
import { addHours } from "date-fns";

const RESET_PASSWORD = `
  mutation ResetPassword($newPassword: String! ,$hash: String! ){
    resetPassword(newPassword:$newPassword, hash: $hash )
  }
`;

describe("mutation resetPassword", () => {
  afterEach(resetDatabase);

  it("should reset user password", async () => {
    const user = await userFactory();
    const newPassword = "loremipsum";

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: addHours(Date.now(), 4),
        user: { connect: { id: user.id } }
      }
    });

    const { mutate } = makeClient();

    const { data } = await mutate<Pick<Mutation, "resetPassword">>(
      RESET_PASSWORD,
      {
        variables: { hash: "abcdef", newPassword }
      }
    );
    // gql response
    expect(data.resetPassword).toEqual(true);

    // hash deleted
    const resetHashExists = await prisma.userResetPasswordHash.count({
      where: { userId: user.id }
    });
    expect(resetHashExists).toEqual(0);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // password updated
    const passwordValid = await compare(newPassword, updatedUser.password);
    expect(passwordValid).toEqual(true);
  });

  it("should not reset user password if hash is not found", async () => {
    const user = await userFactory();
    const newPassword = "loremipsum";

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "xyzer",
        hashExpires: addHours(Date.now(), 4),
        user: { connect: { id: user.id } }
      }
    });
    const oldPasswordHash = user.password;
    const { mutate } = makeClient();

    const { errors } = await mutate<Pick<Mutation, "resetPassword">>(
      RESET_PASSWORD,
      {
        variables: { hash: "qsdfgh", newPassword }
      }
    );

    // gql response
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Lien invalide ou trop ancien.`
      })
    ]);

    // hash not deleted
    const resetHashExists = await prisma.userResetPasswordHash.count({
      where: { userId: user.id }
    });
    expect(resetHashExists).toEqual(1);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // password not updated
    expect(updatedUser.password).toEqual(oldPasswordHash);
  });

  it("should not reset user password if hash is expired", async () => {
    const user = await userFactory();
    const newPassword = "loremipsum";

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "nbvcxw",
        hashExpires: addHours(Date.now(), -1),
        user: { connect: { id: user.id } }
      }
    });
    const oldPasswordHash = user.password;
    const { mutate } = makeClient();

    const { errors } = await mutate<Pick<Mutation, "resetPassword">>(
      RESET_PASSWORD,
      {
        variables: { hash: "nbvcxw", newPassword }
      }
    );
    // gql response

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Lien invalide ou trop ancien.`
      })
    ]);

    // hash not deleted
    const resetHashExists = await prisma.userResetPasswordHash.count({
      where: { userId: user.id }
    });
    expect(resetHashExists).toEqual(1);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // password not updated
    expect(updatedUser.password).toEqual(oldPasswordHash);
  });

  it("should not reset user password if password too short", async () => {
    const user = await userFactory();
    const newPassword = "toto";

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "fghjkl",
        hashExpires: addHours(Date.now(), 4),
        user: { connect: { id: user.id } }
      }
    });
    const oldPasswordHash = user.password;
    const { mutate } = makeClient();

    const { errors } = await mutate<Pick<Mutation, "resetPassword">>(
      RESET_PASSWORD,
      {
        variables: { hash: "fghjkl", newPassword }
      }
    );
    // gql response

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Mot de passe trop court.`
      })
    ]);

    // hash not deleted
    const resetHashExists = await prisma.userResetPasswordHash.count({
      where: { userId: user.id }
    });
    expect(resetHashExists).toEqual(1);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    // password not updated
    expect(updatedUser.password).toEqual(oldPasswordHash);
  });
});
