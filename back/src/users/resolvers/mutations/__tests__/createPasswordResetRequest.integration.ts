import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";
import * as mailsHelper from "../../../../mailer/mailing";
import { createPasswordResetRequest } from "../../../../mailer/templates";
import { renderMail } from "../../../../mailer/templates/renderers";
import { addMinutes } from "date-fns";
import { setCaptchaToken } from "../../../../common/redis/captcha";
import { gql } from "apollo-server-express";

// Mails spy
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const CREATE_PASSWORD_RESET_REQUEST = gql`
  mutation CreatePasswordResetRequest(
    $input: CreatePasswordResetRequestInput!
  ) {
    createPasswordResetRequest(input: $input)
  }
`;

describe("mutation createPasswordResetRequest", () => {
  afterAll(resetDatabase);
  afterEach(sendMailSpy.mockClear);

  it("should initiate password reset process", async () => {
    const user = await userFactory();
    const { mutate } = makeClient();
    const token = "xyz987";
    const captcha = "TD1234";
    await setCaptchaToken(token, captcha);
    const { data } = await mutate<Pick<Mutation, "createPasswordResetRequest">>(
      CREATE_PASSWORD_RESET_REQUEST,
      {
        variables: {
          input: {
            email: user.email,
            captcha: { value: captcha, token: token }
          }
        }
      }
    );
    expect(data.createPasswordResetRequest).toEqual(true);

    const resetHash = await prisma.userResetPasswordHash.findFirstOrThrow({
      where: { userId: user.id }
    });

    // expires delta is 4 hour, let's check with a slightly smaller value (3H59)
    expect(resetHash.hashExpires > addMinutes(Date.now(), 239)).toEqual(true);

    expect(sendMailSpy).toHaveBeenNthCalledWith(
      1,
      renderMail(createPasswordResetRequest, {
        to: [{ email: user.email, name: user.name }],
        variables: {
          resetHash: resetHash.hash
        }
      })
    );
  });
  it("should require a valid captcha", async () => {
    const user = await userFactory();
    const { mutate } = makeClient();
    const token = "xyz986";
    const captcha = "TD1232";
    await setCaptchaToken(token, captcha);
    const { errors } = await mutate<
      Pick<Mutation, "createPasswordResetRequest">
    >(CREATE_PASSWORD_RESET_REQUEST, {
      variables: {
        input: {
          email: "donotexist@notfound.com",
          captcha: { value: "plop", token: token }
        }
      }
    });

    const resetHash = await prisma.userResetPasswordHash.findFirst({
      where: { userId: user.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le test anti-robots est incorrect",

        extensions: {
          code: "BAD_USER_INPUT"
        }
      })
    ]);

    expect(resetHash).toBe(null);

    expect(sendMailSpy).not.toHaveBeenCalled();
  });
  it("should silence not found email", async () => {
    const user = await userFactory();
    const { mutate } = makeClient();
    const token = "xyz9871";
    const captcha = "TD12341";
    await setCaptchaToken(token, captcha);
    const { data } = await mutate<Pick<Mutation, "createPasswordResetRequest">>(
      CREATE_PASSWORD_RESET_REQUEST,
      {
        variables: {
          input: {
            email: "donotexist@notfound.com",
            captcha: { value: captcha, token: token }
          }
        }
      }
    );
    expect(data.createPasswordResetRequest).toEqual(true);

    const resetHash = await prisma.userResetPasswordHash.findFirst({
      where: { userId: user.id }
    });
    expect(resetHash).toBe(null);

    expect(sendMailSpy).not.toHaveBeenCalled();
  });
});
