import * as mailsHelper from "../../../common/mails.helper";
import { server } from "../../../server";
import { createTestClient } from "apollo-server-integration-testing";
import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";
import { userMails } from "../../mails";
import { userFactory, companyFactory } from "../../../__tests__/factories";
import { ErrorCode } from "../../../common/errors";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

describe("{ mutation { signup } }", () => {
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

    const mutation = `
      mutation {
        signup(
          userInfos: {
            email: "${user.email}"
            password: "newUserPassword"
            name: "${user.name}"
            phone: "${user.phone}"
          }
        ) { email, name, phone }
      }
    `;

    const { data } = await mutate(mutation);
    expect(data.signup).toEqual(user);

    const newUser = await prisma.user({ email: user.email });
    expect(newUser.email).toEqual(user.email);

    const activationHashes = await prisma.userActivationHashes({
      where: { user: { email: user.email } }
    });
    expect(activationHashes.length).toEqual(1);

    expect(sendMailSpy).toHaveBeenCalledWith(
      userMails.onSignup(newUser, activationHashes[0].hash)
    );
  });

  it("should throw BAD_USER_INPUT if email already exist", async () => {
    const alreadyExistingUser = await userFactory();
    const mutation = `
      mutation {
        signup(
          userInfos: {
            email: "${alreadyExistingUser.email}"
            password: "newUserPassword"
            name: "${alreadyExistingUser.name}"
            phone: "${alreadyExistingUser.phone}"
          }
        ) { email, name, phone }
      }
    `;

    const { errors } = await mutate(mutation);
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should throw BAD_USER_INPUT if email is not formatted correctly", async () => {
    const user = {
      email: "bademail",
      name: "New User",
      phone: "06 00 00 00 00",
      password: "newUserPassword"
    };

    const mutation = `
      mutation {
        signup(
          userInfos: {
            email: "${user.email}"
            password: "${user.password}"
            name: "${user.name}"
            phone: "${user.phone}"
          }
        ) { email, name, phone }
      }
    `;

    const { errors } = await mutate(mutation);
    expect(errors[0].extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should throw BAD_USER_INPUT if password is less than 8 characters long", async () => {
    const user = {
      email: "bademail",
      name: "New User",
      phone: "06 00 00 00 00",
      password: "pass"
    };
    const mutation = `
      mutation {
        signup(
          userInfos: {
            email: "${user.email}"
            password: "${user.password}"
            name: "${user.name}"
            phone: "${user.phone}"
          }
        ) { email, name, phone }
      }
    `;
    const { errors } = await mutate(mutation);
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

    await prisma.createUserAccountHash({
      email: user.email,
      companySiret: company.siret,
      hash: "hash",
      role: "MEMBER"
    });

    const mutation = `
      mutation {
        signup(
          userInfos: {
            email: "${user.email}"
            password: "newUserPassword"
            name: "${user.name}"
            phone: "${user.phone}"
          }
        ) { email, name, phone }
      }
    `;

    await mutate(mutation);

    const newUser = await prisma.user({ email: user.email });

    const accountHashesCount = await prisma
      .userAccountHashesConnection()
      .aggregate()
      .count();

    expect(accountHashesCount).toEqual(0);

    const companyAssociation = await prisma.companyAssociations({
      where: { user: { id: newUser.id }, company: { id: company.id } }
    });

    expect(companyAssociation).toHaveLength(1);
  });
});
