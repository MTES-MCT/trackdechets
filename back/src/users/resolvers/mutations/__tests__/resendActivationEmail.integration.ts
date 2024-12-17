import { gql } from "graphql-tag";
import { prisma } from "@td/prisma";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { sendMail } from "../../../../mailer/mailing";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { onSignup, renderMail } from "@td/mail";
import { setCaptchaToken } from "../../../../common/redis/captcha";
import type { Mutation } from "@td/codegen-back";

const RESEND_ACTIVATION_EMAIL = gql`
  mutation ResendActivationEmail($input: ResendActivationEmailInput!) {
    resendActivationEmail(input: $input)
  }
`;

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

describe("mutation resendActivationEmail", () => {
  afterAll(resetDatabase);
  afterEach((sendMail as jest.Mock).mockClear);

  it("should resend activation email to user", async () => {
    const user = await userFactory({ isActive: false });
    const hash = "hash_1";
    await prisma.userActivationHash.create({
      data: { userId: user.id, hash }
    });
    const token = "xyz654";
    const captcha = "TD765";
    await setCaptchaToken(token, captcha);
    const { mutate } = makeClient();
    await mutate<Pick<Mutation, "resendActivationEmail">>(
      RESEND_ACTIVATION_EMAIL,
      {
        variables: {
          input: {
            email: user.email,
            captcha: { value: captcha, token: token }
          }
        }
      }
    );
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(onSignup, {
        to: [{ name: user.name, email: user.email }],
        variables: { activationHash: hash }
      })
    );
  });

  it("should return true if user does not exist", async () => {
    const { mutate } = makeClient();
    const token = "xyz650";
    const captcha = "TD765";
    await setCaptchaToken(token, captcha);
    const { data, errors } = await mutate(RESEND_ACTIVATION_EMAIL, {
      variables: {
        input: {
          email: "john.snow@trackdechets.fr",
          captcha: { value: captcha, token: token }
        }
      }
    });
    expect(data.resendActivationEmail).toEqual(true);
    expect(errors).toEqual(undefined);
    // no mail sent
    expect(sendMail as jest.Mock).not.toHaveBeenCalled();
  });

  it("should return true if user is already active", async () => {
    const user = await userFactory({ isActive: true });
    const token = "xyz652";
    const captcha = "TD765";
    await setCaptchaToken(token, captcha);
    await prisma.userActivationHash.create({
      data: { userId: user.id, hash: "hash_2" }
    });
    const { mutate } = makeClient();
    const { data, errors } = await mutate(RESEND_ACTIVATION_EMAIL, {
      variables: {
        input: {
          email: user.email,
          captcha: { value: captcha, token: token }
        }
      }
    });
    expect(errors).toEqual(undefined);
    expect(data.resendActivationEmail).toEqual(true);

    // no mail sent
    expect(sendMail as jest.Mock).not.toHaveBeenCalled();
  });

  it("should expect a valid captcha", async () => {
    const user = await userFactory({ isActive: true });
    const token = "xyz652";
    const captcha = "TD765";
    await setCaptchaToken(token, captcha);
    await prisma.userActivationHash.create({
      data: { userId: user.id, hash: "hash_3" }
    });
    const { mutate } = makeClient();
    const { errors } = await mutate(RESEND_ACTIVATION_EMAIL, {
      variables: {
        input: {
          email: user.email,
          captcha: { value: "toto", token: token }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le test anti-robots est incorrect",

        extensions: expect.objectContaining({
          code: "BAD_USER_INPUT"
        })
      })
    ]);
    // no mail sent
    expect(sendMail as jest.Mock).not.toHaveBeenCalled();
  });
});
