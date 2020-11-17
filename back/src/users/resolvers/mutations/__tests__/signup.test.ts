import { signupFn as signup } from "../signup";
import prisma from "src/prisma";
const userInfos = {
  id: "new_user",
  name: "an user",
  email: "an@email.com",
  password: "a password",
  phone: "0000"
};

jest.mock("src/prisma", () => ({
  prisma: {
    user: {
      create: jest.fn(() => Promise.resolve(userInfos)),
      findFirst: jest.fn(() => Promise.resolve(null))
    },
    userActivationHash: {
      create: jest.fn(() => Promise.resolve({ hash: "an hash" }))
    },
    userAccountHash: {
      findMany: jest.fn(() => Promise.resolve([])),
      updateMany: jest.fn(() => Promise.resolve())
    },
    companyAssociation: {
      create: jest.fn(() => Promise.resolve())
    }
  }
}));

jest.mock("../../../../mailer/mailing", () => ({
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

    expect(prisma.userActivationHash.create).toHaveBeenCalledTimes(1);
  });

  test("should accept all pending invitations", async () => {
    const hashes = [
      { companySiret: "", role: "ADMIN" },
      { companySiret: "", role: "ADMIN" },
      { companySiret: "", role: "ADMIN" }
    ];
    (prisma.userAccountHash.findMany as jest.Mock).mockResolvedValue(hashes);

    await signup({ userInfos });

    expect(prisma.companyAssociation.create).toHaveBeenCalledTimes(
      hashes.length
    );
    expect(prisma.userAccountHash.updateMany).toHaveBeenCalledTimes(1);
  });
});
