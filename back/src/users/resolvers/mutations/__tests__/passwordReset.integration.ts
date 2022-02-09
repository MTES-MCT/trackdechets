import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";
import * as mailsHelper from "../../../../mailer/mailing";
import { resetPassword } from "../../../../mailer/templates";
import { renderMail } from "../../../../mailer/templates/renderers";

// Mails spy
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const RESET_PASSWORD = `
  mutation ResetPassword($email: String! ){
    resetPassword(email: $email )
  }
`;

describe("mutation resetPassword", () => {
  afterAll(resetDatabase);
  afterEach(sendMailSpy.mockClear);

  it("should initiate password reset process", async () => {
    const user = await userFactory();
    const { mutate } = makeClient();

    const { data } = await mutate<Pick<Mutation, "resetPassword">>(
      RESET_PASSWORD,
      {
        variables: { email: user.email }
      }
    );
    expect(data.resetPassword).toEqual(true);

    const resetHash = await prisma.userResetPasswordHash.findFirst({
      where: { userId: user.id }
    });

    // expires delta is one hour, let's check with a slightly smaller value
    expect(resetHash.hashExpires > new Date(Date.now() + 1000 * 3550)).toEqual(
      true
    );

    expect(sendMailSpy).toHaveBeenNthCalledWith(
      1,
      renderMail(resetPassword, {
        to: [{ email: user.email, name: user.name }],
        variables: {
          resetHash: resetHash.hash
        }
      })
    );
  });
});
