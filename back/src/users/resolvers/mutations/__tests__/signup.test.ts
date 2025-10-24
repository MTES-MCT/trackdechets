import { signupFn as signup } from "../signup";
import { prisma } from "@td/prisma";
import configureYup from "../../../../common/yup/configureYup";
import * as redisUser from "../../../../common/redis/users";

configureYup();

const userInfos = {
  id: "new_user",
  name: "an user",
  email: "an@email.com",
  password: "a password",
  phone: "0000"
};

jest.mock("@td/prisma", () => ({
  ...jest.requireActual("@td/prisma"),
  prisma: {
    user: {
      create: jest.fn(() => Promise.resolve(userInfos)),
      update: jest.fn(() => Promise.resolve(userInfos)),
      findUnique: jest.fn(() => Promise.resolve(null)),
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
  }
}));

jest.mock("../../../../mailer/mailing", () => ({
  sendMail: () => null
}));

jest.mock("../../../../common/redis/users");

(redisUser.deleteCachedUserRoles as jest.Mock).mockResolvedValue(null);

describe("signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create user", async () => {
    const res = await signup({ userInfos });

    expect(res).toBe(true);
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
    expect(redisUser.deleteCachedUserRoles as jest.Mock).toHaveBeenCalledTimes(
      1
    );
  });
});
