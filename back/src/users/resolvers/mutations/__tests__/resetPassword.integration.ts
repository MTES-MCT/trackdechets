import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";
import { compare } from "bcrypt";
import { addHours } from "date-fns";
import { ErrorCode } from "../../../../common/errors";
import { redisClient } from "../../../../common/redis";
import {
  storeUserSessionsId,
  genUserSessionsIdsKey
} from "../../../../common/redis/users";

const RESET_PASSWORD = `
  mutation ResetPassword($newPassword: String! ,$hash: String! ){
    resetPassword(newPassword:$newPassword, hash: $hash )
  }
`;
const viablePassword = "trackdechets#";

describe("mutation resetPassword", () => {
  afterEach(resetDatabase);

  it("should deny short password", async () => {
    const user = await userFactory();
    const newPassword = "titi";

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: addHours(Date.now(), 4),
        user: { connect: { id: user.id } }
      }
    });

    const { mutate } = makeClient();

    const { errors } = await mutate<Pick<Mutation, "resetPassword">>(
      RESET_PASSWORD,
      {
        variables: { hash: "abcdef", newPassword: newPassword }
      }
    );
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should deny weak short password", async () => {
    const user = await userFactory();
    const newPassword = "aaaaaaaaaaa";

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: addHours(Date.now(), 4),
        user: { connect: { id: user.id } }
      }
    });

    const { mutate } = makeClient();

    const { errors } = await mutate<Pick<Mutation, "resetPassword">>(
      RESET_PASSWORD,
      {
        variables: { hash: "abcdef", newPassword }
      }
    );
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should deny long short password", async () => {
    const user = await userFactory();
    const newPassword =
      "Lorem-ipsum-dolor-sit-amet-consectetur-adipiscing-elit-Ut-volutpat";

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: addHours(Date.now(), 4),
        user: { connect: { id: user.id } }
      }
    });

    const { mutate } = makeClient();

    const { errors } = await mutate<Pick<Mutation, "resetPassword">>(
      RESET_PASSWORD,
      {
        variables: { hash: "abcdef", newPassword }
      }
    );
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should reset user password", async () => {
    const user = await userFactory();
    // create a few redis sessions entries
    const sessionId1 = `xyz123`;
    const sessionId2 = `abcd654`;
    const sessionKey1 = `sess:${sessionId1}`;
    const sessionKey2 = `sess:${sessionId2}`;
    await redisClient.set(sessionKey1, "data");
    await redisClient.set(sessionKey2, "data");
    // reference them
    await storeUserSessionsId(user.id, sessionId1);
    await storeUserSessionsId(user.id, sessionId2);

    await prisma.userResetPasswordHash.create({
      data: {
        hash: "abcdef",
        hashExpires: addHours(Date.now(), 4),
        user: { connect: { id: user.id } }
      }
    });

    // we have some other pending hashes, they should be deleted after a successful password reset
    await prisma.userResetPasswordHash.create({
      data: {
        hash: "xyz1",
        hashExpires: addHours(Date.now(), 4),
        user: { connect: { id: user.id } }
      }
    });
    await prisma.userResetPasswordHash.create({
      data: {
        hash: "xyz2",
        hashExpires: addHours(Date.now(), 4),
        user: { connect: { id: user.id } }
      }
    });
    const { mutate } = makeClient();

    const { data } = await mutate<Pick<Mutation, "resetPassword">>(
      RESET_PASSWORD,
      {
        variables: { hash: "abcdef", newPassword: viablePassword }
      }
    );
    // gql response
    expect(data.resetPassword).toEqual(true);

    // all hashes were deleted
    const resetHashExists = await prisma.userResetPasswordHash.count({
      where: { userId: user.id }
    });
    expect(resetHashExists).toEqual(0);

    // sessions are deleted
    expect(await redisClient.exists(sessionKey1)).toBeFalsy();
    expect(await redisClient.exists(sessionKey2)).toBeFalsy();
    // user sessions references entry is deleted
    expect(
      await redisClient.exists(genUserSessionsIdsKey(user.id))
    ).toBeFalsy();

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // password updated
    const passwordValid = await compare(viablePassword, updatedUser.password);
    expect(passwordValid).toEqual(true);
  });

  it("should not reset user password if hash is not found", async () => {
    const user = await userFactory();

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
        variables: { hash: "qsdfgh", newPassword: viablePassword }
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

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // password not updated
    expect(updatedUser.password).toEqual(oldPasswordHash);
  });

  it("should not reset user password if hash is expired", async () => {
    const user = await userFactory();

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
        variables: { hash: "nbvcxw", newPassword: viablePassword }
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

    const updatedUser = await prisma.user.findUniqueOrThrow({
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
        message: `Le mot de passe est trop court (Il fait 4 caractères, le minimum est de 10 caractères)`
      })
    ]);

    // hash not deleted
    const resetHashExists = await prisma.userResetPasswordHash.count({
      where: { userId: user.id }
    });
    expect(resetHashExists).toEqual(1);

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id }
    });

    // password not updated
    expect(updatedUser.password).toEqual(oldPasswordHash);
  });
});
