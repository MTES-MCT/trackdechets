import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../../../common/errors";
import { sendMail } from "../../../../mailer/mailing";
import { companyFactory, userFactory } from "../../../../__tests__/factories";
import { renderMail, onSignup } from "@td/mail";
import type { Mutation } from "@td/codegen-back";
import makeClient from "../../../../__tests__/testClient";

const viablePassword = "Trackdechets1#";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

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
  let mutate: ReturnType<typeof makeClient>["mutate"];
  beforeAll(() => {
    const testClient = makeClient();
    mutate = testClient.mutate;
  });

  afterEach(async () => {
    await resetDatabase();
    (sendMail as jest.Mock).mockClear();
  });

  it("should create user, activation hash and send email", async () => {
    const user = {
      email: "newuser@td.io",
      name: "New User",
      phone: "06 00 00 00 00"
    };

    const { data } = await mutate<Pick<Mutation, "signup">>(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: viablePassword,
          name: user.name,
          phone: user.phone
        }
      }
    });

    expect(data.signup).toEqual(user);

    const newUser = await prisma.user.findUniqueOrThrow({
      where: { email: user.email }
    });
    expect(newUser.email).toEqual(user.email);

    const activationHashes = await prisma.userActivationHash.findMany({
      where: { user: { email: user.email } }
    });
    expect(activationHashes.length).toEqual(1);

    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(onSignup, {
        to: [{ email: newUser.email, name: newUser.name }],
        variables: { activationHash: activationHashes[0].hash }
      })
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
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
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
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
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
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should throw BAD_USER_INPUT if password is less than 10 characters long", async () => {
    const user = {
      email: "bademail",
      name: "New User",
      phone: "06 00 00 00 00",
      password: "loremipsu"
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
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should throw BAD_USER_INPUT if password is not complex enough", async () => {
    const user = {
      email: "bademail",
      name: "New User",
      phone: "06 00 00 00 00",
      password: "aaaaaaaaaaaa"
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
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should throw BAD_USER_INPUT if password is to long", async () => {
    const user = {
      email: "bademail",
      name: "New User",
      phone: "06 00 00 00 00",
      password:
        "Lorem-ipsum-dolor-sit-amet-consectetur-adipiscing-elit-Ut-volutpat"
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
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  it("should throw BAD_USER_INPUT if name contains unsafe SSTI chars", async () => {
    const user = {
      email: "newuser@td.io",
      name: "Ihackoulol {{dump(app)}}",
      phone: "06 00 00 00 00",
      password: "newUserPassword"
    };
    const { errors } = await mutate(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: viablePassword,
          name: user.name,
          phone: user.phone
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Les caractères suivants sont interdits: { } % < > $ ' " =`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
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
        companySiret: company.siret!,
        hash: "hash",
        role: "MEMBER"
      }
    });

    await mutate(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: viablePassword,
          name: user.name,
          phone: user.phone
        }
      }
    });

    const newUser = await prisma.user.findUniqueOrThrow({
      where: { email: user.email }
    });

    const updatedInvitation = await prisma.userAccountHash.findUniqueOrThrow({
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
