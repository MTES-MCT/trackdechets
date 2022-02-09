import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";

import { compare } from "bcrypt";
const UPDATE_PASSWORD = `
  mutation UpdatePassword($newPassword: String! ,$hash: String! ){
    updatePassword(newPassword:$newPassword, hash: $hash )
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
        hashExpires: new Date(Date.now() + 3600 * 60),
        user: { connect: { id: user.id } }
      }
    });

    const { mutate } = makeClient();

    const { data } = await mutate<Pick<Mutation, "updatePassword">>(
      UPDATE_PASSWORD,
      {
        variables: { hash: "abcdef", newPassword }
      }
    );
    // gql response
    expect(data.updatePassword).toEqual(true);

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
        hashExpires: new Date(Date.now() + 3600 * 60),
        user: { connect: { id: user.id } }
      }
    });
    const oldPasswordHash = user.password;
    const { mutate } = makeClient();

    const { errors } = await mutate<Pick<Mutation, "updatePassword">>(
      UPDATE_PASSWORD,
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
        hashExpires: new Date(Date.now() - 1),
        user: { connect: { id: user.id } }
      }
    });
    const oldPasswordHash = user.password;
    const { mutate } = makeClient();

    const { errors } = await mutate<Pick<Mutation, "updatePassword">>(
      UPDATE_PASSWORD,
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
        hashExpires: new Date(Date.now() + 3600 * 1000),
        user: { connect: { id: user.id } }
      }
    });
    const oldPasswordHash = user.password;
    const { mutate } = makeClient();

    const { errors } = await mutate<Pick<Mutation, "updatePassword">>(
      UPDATE_PASSWORD,
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
