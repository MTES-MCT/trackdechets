import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";
import { sendMail } from "../../../../mailer/mailing";
import { renderMail, createPasswordResetRequest } from "@td/mail";
import { addMinutes } from "date-fns";
import { setCaptchaToken } from "../../../../common/redis/captcha";
import { gql } from "graphql-tag";

// Mails spy
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const CREATE_PASSWORD_RESET_REQUEST = gql`
  mutation CreatePasswordResetRequest(
    $input: CreatePasswordResetRequestInput!
  ) {
    createPasswordResetRequest(input: $input)
  }
`;

describe("mutation createPasswordResetRequest", () => {
  afterAll(resetDatabase);
  afterEach((sendMail as jest.Mock).mockClear);

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

    expect(sendMail as jest.Mock).toHaveBeenNthCalledWith(
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

        extensions: expect.objectContaining({
          code: "BAD_USER_INPUT"
        })
      })
    ]);

    expect(resetHash).toBe(null);

    expect(sendMail as jest.Mock).not.toHaveBeenCalled();
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

    expect(sendMail as jest.Mock).not.toHaveBeenCalled();
  });
});
