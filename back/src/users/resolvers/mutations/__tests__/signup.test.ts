import { signupFn as signup } from "../signup";
import { prisma } from "../../../../generated/prisma-client";

const userInfos = {
  id: "new_user",
  name: "an user",
  email: "an@email.com",
  password: "a password",
  phone: "0000"
};

jest.mock("../../../../generated/prisma-client", () => ({
  prisma: {
    createUser: jest.fn(() => Promise.resolve(userInfos)),
    $exists: {
      user: jest.fn(() => Promise.resolve(false))
    },
    createUserActivationHash: jest.fn(() =>
      Promise.resolve({ hash: "an hash" })
    ),
    userAccountHashes: jest.fn(() => Promise.resolve([])),
    createCompanyAssociation: jest.fn(() => Promise.resolve()),
    deleteManyUserAccountHashes: jest.fn(() => Promise.resolve())
  }
}));

jest.mock("../../../../common/mails.helper", () => ({
  sendMail: () => null
}));

describe("signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create user", async () => {
    const user = await signup({ userInfos });

    expect(user.id).toBe("new_user");
  });

  test("should create activation hash", async () => {
    await signup({ userInfos });

    expect(prisma.createUserActivationHash).toHaveBeenCalledTimes(1);
  });

  test("should accept all pending invitations", async () => {
    const hashes = [
      { companySiret: "", role: "ADMIN" },
      { companySiret: "", role: "ADMIN" },
      { companySiret: "", role: "ADMIN" }
    ];
    (prisma.userAccountHashes as jest.Mock).mockResolvedValue(hashes);

    await signup({ userInfos });

    expect(prisma.createCompanyAssociation).toHaveBeenCalledTimes(
      hashes.length
    );
    expect(prisma.deleteManyUserAccountHashes).toHaveBeenCalledTimes(1);
  });
});
