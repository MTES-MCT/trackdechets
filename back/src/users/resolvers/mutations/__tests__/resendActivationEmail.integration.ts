import { gql } from "apollo-server-express";
import prisma from "../../../../prisma";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import * as mailing from "../../../../mailer/mailing";
import { ErrorCode } from "../../../../common/errors";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { renderMail } from "../../../../mailer/templates/renderers";
import { onSignup } from "../../../../mailer/templates";

const RESEND_ACTIVATION_EMAIL = gql`
  mutation ResendActivationEmail($email: String!) {
    resendActivationEmail(email: $email)
  }
`;

// No mails
const sendMailSpy = jest.spyOn(mailing, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

describe("mutation resendActivationEmail", () => {
  afterAll(resetDatabase);

  it("should resend activation email to user", async () => {
    const user = await userFactory({ isActive: false });
    const hash = "hash_1";
    await prisma.userActivationHash.create({
      data: { userId: user.id, hash }
    });
    const { mutate } = makeClient();
    await mutate(RESEND_ACTIVATION_EMAIL, { variables: { email: user.email } });
    expect(sendMailSpy).toHaveBeenCalledWith(
      renderMail(onSignup, {
        to: [{ name: user.name, email: user.email }],
        variables: { activationHash: hash }
      })
    );
  });

  it("should return UserInputError if user does not exist", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate(RESEND_ACTIVATION_EMAIL, {
      variables: { email: "john.snow@trackdechets.fr" }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cet email n'existe pas sur notre plateforme.",
        extensions: { code: ErrorCode.BAD_USER_INPUT }
      })
    ]);
  });

  it("should return UserInputError if user is already active", async () => {
    const user = await userFactory({ isActive: true });
    await prisma.userActivationHash.create({
      data: { userId: user.id, hash: "hash_2" }
    });
    const { mutate } = makeClient();
    const { errors } = await mutate(RESEND_ACTIVATION_EMAIL, {
      variables: { email: user.email }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Ce compte a déjà été activé",
        extensions: { code: ErrorCode.BAD_USER_INPUT }
      })
    ]);
  });
});
