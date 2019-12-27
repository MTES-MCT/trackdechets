import { createUserAccountHash } from "../createUserAccountHash";
import { ErrorCode } from "../../../common/errors";

const mockUserAccountHashes = jest.fn();
const mockCreateUserAccountHash = jest.fn();

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    userAccountHashes: jest.fn((...args) => mockUserAccountHashes(...args)),
    createUserAccountHash: jest.fn((...args) =>
      mockCreateUserAccountHash(...args)
    )
  }
}));

const mockHash = jest.fn();

jest.mock("bcrypt", () => ({
  hash: jest.fn((...args) => mockHash(...args))
}));

describe("createUserAccountHash", () => {
  beforeEach(() => {
    mockUserAccountHashes.mockReset();
    mockCreateUserAccountHash.mockReset();
    mockHash.mockReset();
  });

  it("should return user account hash", async () => {
    mockUserAccountHashes.mockResolvedValueOnce([]);
    mockHash.mockResolvedValueOnce("hash");
    mockCreateUserAccountHash.mockResolvedValueOnce("hash");
    const hash = await createUserAccountHash(
      "arya.starck@gmail.com",
      "MEMBER",
      "85001946400013"
    );
    expect(hash).toEqual("hash");
    expect(mockCreateUserAccountHash).toHaveBeenCalledWith({
      hash: "hash",
      email: "arya.starck@gmail.com",
      role: "MEMBER",
      companySiret: "85001946400013"
    });
  });

  it("should throw error if hash already exists", async () => {
    mockUserAccountHashes.mockResolvedValueOnce([
      {
        hash: "hash",
        email: "",
        companySiret: "",
        role: "MEMBER"
      }
    ]);
    expect.assertions(1);
    try {
      await createUserAccountHash(
        "arya.starck@gmail.com",
        "MEMBER",
        "85001946400013"
      );
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });
});
