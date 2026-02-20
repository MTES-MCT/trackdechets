import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../../../common/errors";
import { sendMail } from "../../../../mailer/mailing";
import { companyFactory, userFactory } from "../../../../__tests__/factories";
import { renderMail, onSignup } from "@td/mail";
import type { Mutation } from "@td/codegen-back";
import makeClient from "../../../../__tests__/testClient";
import { addDays } from "date-fns";

const viablePassword = "Trackdechets1#";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const SIGNUP = `
  mutation SignUp($userInfos: SignupInput!) {
    signup(userInfos: $userInfos)
  }
`;

describe("Mutation.signup", () => {
  it("should not allow name with less than 2 letters", async () => {
    const user = {
      email: "shortname@td.io",
      name: "A",
      phone: "06 00 00 00 00"
    };
    const { errors } = await mutate<Pick<Mutation, "signup">>(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: viablePassword,
          name: user.name,
          phone: user.phone
        }
      }
    });
    expect(errors).not.toBeUndefined();
    expect(errors?.[0].message).toBe(
      "Le nom doit contenir au moins 2 lettres."
    );
  });

  it("should not allow name with only special characters", async () => {
    const user = {
      email: "specialchars@td.io",
      name: ".-",
      phone: "06 00 00 00 00"
    };
    const { errors } = await mutate<Pick<Mutation, "signup">>(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: viablePassword,
          name: user.name,
          phone: user.phone
        }
      }
    });
    expect(errors).not.toBeUndefined();
    expect(errors?.[0].message).toBe(
      "Le nom doit contenir au moins 2 lettres."
    );
  });
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

    const { data, errors } = await mutate<Pick<Mutation, "signup">>(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: viablePassword,
          name: user.name,
          phone: user.phone
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.signup).toEqual(true);

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

  it("should not allow name with only spaces", async () => {
    // Given
    const user = {
      email: "newuser@td.io",
      name: "  ",
      phone: "06 00 00 00 00"
    };

    // When
    const { errors } = await mutate<Pick<Mutation, "signup">>(SIGNUP, {
      variables: {
        userInfos: {
          email: user.email,
          password: viablePassword,
          name: user.name,
          phone: user.phone
        }
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors?.[0].message).toBe(
      "Le nom doit contenir au moins 2 lettres."
    );
  });

  it("should return the same result if email already exist", async () => {
    const alreadyExistingUser = await userFactory();

    const { data } = await mutate(SIGNUP, {
      variables: {
        userInfos: {
          email: alreadyExistingUser.email,
          password: viablePassword,
          name: alreadyExistingUser.name,
          phone: alreadyExistingUser.phone
        }
      }
    });

    expect(data.signup).toEqual(true);
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

  it("should throw BAD_USER_INPUT if password is too long", async () => {
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
        message: `Les caractères suivants sont interdits: { } % < > $ " =`,
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should accept pending invitations", async () => {
    // Given
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
    await prisma.userAccountHash.update({
      where: { id: invitation.id },
      data: { expiresAt: addDays(new Date(), 7) }
    });

    // When
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

    // Then
    expect(errors).toBeUndefined();
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

  it("should not be able to accept expired invitations", async () => {
    // Given
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
    await prisma.userAccountHash.update({
      where: { id: invitation.id },
      data: { expiresAt: addDays(new Date(), -1) }
    });

    // When
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

    // Then
    expect(errors).toBeUndefined();
    const updatedHash = await prisma.userAccountHash.update({
      where: { id: invitation.id },
      data: { expiresAt: addDays(new Date(), -1) }
    });

    // The invitation was not accepted
    expect(updatedHash.acceptedAt).toBeNull();
  });

  it("should not accept already accepted invitations", async () => {
    // Given
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

    const acceptedAt = addDays(new Date(), -2);
    await prisma.userAccountHash.update({
      where: { id: invitation.id },
      data: { acceptedAt, expiresAt: addDays(new Date(), 5) }
    });

    // When
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

    // Then
    expect(errors).toBeUndefined();
    const updatedHash = await prisma.userAccountHash.update({
      where: { id: invitation.id },
      data: { expiresAt: addDays(new Date(), -1) }
    });

    // The invitation shall not have changed
    expect(updatedHash.acceptedAt?.toISOString()).toBe(
      acceptedAt.toISOString()
    );
  });
});
