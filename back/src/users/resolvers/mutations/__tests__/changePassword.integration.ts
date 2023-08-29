import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { compare } from "bcrypt";
import { AuthType } from "../../../../auth";
import { Mutation } from "../../../../generated/graphql/types";
import { ErrorCode } from "../../../../common/errors";
import { redisClient } from "../../../../common/redis";
import {
  storeUserSessionsId,
  getUserSessions
} from "../../../../common/redis/users";

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

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const newPassword = "trackdechets#";
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

    // other sessions are deleted
    expect(await redisClient.exists(sessionKey1)).toBeFalsy();
    expect(await redisClient.exists(sessionKey2)).toBeFalsy();
    // user sessions references entry set to a new session id
    expect((await getUserSessions(user.id)).length).toEqual(1);
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
});
