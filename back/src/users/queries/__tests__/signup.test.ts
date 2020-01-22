import signup from "../signup";

const userInfos = {
  id: "new_user",
  name: "an user",
  email: "an@email.com",
  password: "a password",
  phone: "0000"
};

const context = {
  prisma: {
    createUser: jest.fn(() => Promise.resolve(userInfos)),
    createUserActivationHash: jest.fn(() =>
      Promise.resolve({ hash: "an hash" })
    ),
    userAccountHashes: jest.fn(() => Promise.resolve([])),
    createCompanyAssociation: jest.fn(() => Promise.resolve()),
    deleteManyUserAccountHashes: jest.fn(() => Promise.resolve())
  }
};

jest.mock("../../../common/mails.helper", () => ({
  sendMail: () => null
}));

describe("signup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create user", async () => {
    const user = await signup(null, { userInfos }, context as any);

    expect(user.id).toBe("new_user");
  });

  test("should create activation hash", async () => {
    await signup(null, { userInfos }, context as any);

    expect(context.prisma.createUserActivationHash).toHaveBeenCalledTimes(1);
  });

  test("should accept all pending invitations", async () => {
    const hashes = [
      { companySiret: "", role: "ADMIN" },
      { companySiret: "", role: "ADMIN" },
      { companySiret: "", role: "ADMIN" }
    ];
    context.prisma.userAccountHashes.mockResolvedValue(hashes);

    await signup(null, { userInfos }, context as any);

    expect(context.prisma.createCompanyAssociation).toHaveBeenCalledTimes(
      hashes.length
    );
    expect(context.prisma.deleteManyUserAccountHashes).toHaveBeenCalledTimes(1);
  });
});
