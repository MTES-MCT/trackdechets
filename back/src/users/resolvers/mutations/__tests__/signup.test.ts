import { signupFn as signup } from "../signup";
import prisma from "../../../../prisma";
import configureYup from "../../../../common/yup/configureYup";

configureYup();

const userInfos = {
  id: "new_user",
  name: "an user",
  email: "an@email.com",
  password: "a password",
  phone: "0000"
};

jest.mock("../../../../prisma", () => ({
  user: {
    create: jest.fn(() => Promise.resolve(userInfos)),
    update: jest.fn(() => Promise.resolve(userInfos)),
    findFirst: jest.fn(() => Promise.resolve(null)),
    findMany: jest.fn(() => Promise.resolve([])),
    count: jest.fn(() => Promise.resolve(0))
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
}));

jest.mock("../../../../mailer/mailing", () => ({
  sendMail: () => null
}));

jest.mock("../../../../common/redis/users", () => ({
  deleteCachedUserCompanies: () => jest.fn(() => Promise.resolve())
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
      { companyId: "", role: "ADMIN" },
      { companyId: "", role: "ADMIN" },
      { companyId: "", role: "ADMIN" }
    ];
    (prisma.userAccountHash.findMany as jest.Mock).mockResolvedValue(hashes);

    await signup({ userInfos });

    expect(prisma.companyAssociation.create).toHaveBeenCalledTimes(
      hashes.length
    );
    expect(prisma.userAccountHash.updateMany).toHaveBeenCalledTimes(1);
  });
});
