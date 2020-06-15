import signup from "../signup";
import { prisma, UserWhereInput } from "../../../generated/prisma-client";

const newUserInfos = {
  id: "new_user",
  name: "an user",
  email: "an@email.com",
  password: "a password",
  phone: "0000"
};
const existingUserInfos = {
  id: "existing_user",
  name: "another user",
  email: "existing@email.com",
  password: "a password",
  phone: "0000"
};

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    createUser: jest.fn(() => Promise.resolve(newUserInfos)),
    $exists: {
      user: jest.fn(({ email }: UserWhereInput) =>
        Promise.resolve(email === existingUserInfos.email)
      )
    },
    createUserActivationHash: jest.fn(() =>
      Promise.resolve({ hash: "an hash" })
    ),
    userAccountHashes: jest.fn(() => Promise.resolve([])),
    createCompanyAssociation: jest.fn(() => Promise.resolve()),
    deleteManyUserAccountHashes: jest.fn(() => Promise.resolve())
  }
}));

jest.mock("../../../common/mails.helper", () => ({
  sendMail: () => null
}));

describe("signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create user", async () => {
    const user = await signup(newUserInfos);

    expect(user.id).toBe("new_user");
  });

  test("should not create user if it already exists", async () => {
    const errorMessage =
      "Impossible de créer cet utilisateur. Cet email a déjà un compte";

    await expect(signup(existingUserInfos)).rejects.toThrow(errorMessage);
    await expect(
      signup({
        ...existingUserInfos,
        // it must be case insensitive
        email: existingUserInfos.email.toUpperCase()
      })
    ).rejects.toThrow(errorMessage);
  });

  test("should create activation hash", async () => {
    await signup(newUserInfos);

    expect(prisma.createUserActivationHash).toHaveBeenCalledTimes(1);
  });

  test("should accept all pending invitations", async () => {
    const hashes = [
      { companySiret: "", role: "ADMIN" },
      { companySiret: "", role: "ADMIN" },
      { companySiret: "", role: "ADMIN" }
    ];
    (prisma.userAccountHashes as jest.Mock).mockResolvedValue(hashes);

    await signup(newUserInfos);

    expect(prisma.createCompanyAssociation).toHaveBeenCalledTimes(
      hashes.length
    );
    expect(prisma.deleteManyUserAccountHashes).toHaveBeenCalledTimes(1);
  });
});
