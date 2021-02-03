import { createTestClient } from "apollo-server-integration-testing";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { ErrorCode } from "../../../../common/errors";
import * as mailsHelper from "../../../../mailer/mailing";
import { server } from "../../../../server";
import { companyFactory, userFactory } from "../../../../__tests__/factories";
import { userMails } from "../../../mails";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const SIGNUP = `
  mutation SignUp($userInfos: SignupInput!) {
    signup(userInfos: $userInfos) {
      email
      name
      phone
    }
  }
`;

describe("Mutation.signup", () => {
  afterEach(async () => {
    await resetDatabase();
    sendMailSpy.mockClear();
  });

  const { mutate } = createTestClient({
    apolloServer: server
  });

  it("should create user, activation hash and send email", async () => {
    const user = {
      email: "newuser@td.io",
      name: "New User",
      phone: "06 00 00 00 00"
    };

    const { data } = await mutate(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: "newUserPassword",
          name: user.name,
          phone: user.phone
        }
      }
    });
    expect(data.signup).toEqual(user);

    const newUser = await prisma.user.findUnique({
      where: { email: user.email }
    });
    expect(newUser.email).toEqual(user.email);

    const activationHashes = await prisma.userActivationHash.findMany({
      where: { user: { email: user.email } }
    });
    expect(activationHashes.length).toEqual(1);

    expect(sendMailSpy).toHaveBeenCalledWith(
      userMails.onSignup(newUser, activationHashes[0].hash)
    );
  });

  it("should throw BAD_USER_INPUT if email already exist", async () => {
    const alreadyExistingUser = await userFactory();

    const { errors } = await mutate(SIGNUP, {
      variables: {
        userInfos: {
          email: alreadyExistingUser.email,
          password: "newUserPassword",
          name: alreadyExistingUser.name,
          phone: alreadyExistingUser.phone
        }
      }
    });
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should throw BAD_USER_INPUT if email already exist regarldess of the email casing", async () => {
    const alreadyExistingUser = await userFactory();

    const { errors } = await mutate(SIGNUP, {
      variables: {
        userInfos: {
          email: alreadyExistingUser.email.toUpperCase(),
          password: "newUserPassword",
          name: alreadyExistingUser.name,
          phone: alreadyExistingUser.phone
        }
      }
    });
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should throw BAD_USER_INPUT if email is not valid", async () => {
    const user = {
      email: "bademail",
      name: "New User",
      phone: "06 00 00 00 00",
      password: "newUserPassword"
    };

    const { errors } = await mutate(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: user.password,
          name: user.name,
          phone: user.phone
        }
      }
    });
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should throw BAD_USER_INPUT if password is less than 8 characters long", async () => {
    const user = {
      email: "bademail",
      name: "New User",
      phone: "06 00 00 00 00",
      password: "pass"
    };
    const { errors } = await mutate(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: user.password,
          name: user.name,
          phone: user.phone
        }
      }
    });
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should accept pending invitations", async () => {
    const user = {
      email: "newuser@td.io",
      name: "New User",
      phone: "06 00 00 00 00",
      password: "newUserPassword"
    };

    const company = await companyFactory();

    const invitation = await prisma.userAccountHash.create({
      data: {
        email: user.email,
        companySiret: company.siret,
        hash: "hash",
        role: "MEMBER"
      }
    });

    await mutate(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: "newUserPassword",
          name: user.name,
          phone: user.phone
        }
      }
    });

    const newUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    const updatedInvitation = await prisma.userAccountHash.findUnique({
      where: {
        id: invitation.id
      }
    });
    expect(updatedInvitation.acceptedAt).not.toBeNull();

    const companyAssociation = await prisma.companyAssociation.findMany({
      where: { user: { id: newUser.id }, company: { id: company.id } }
    });

    expect(companyAssociation).toHaveLength(1);
  });
});
