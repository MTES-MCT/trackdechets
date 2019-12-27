import { changePassword } from "../changePassword";
import { ErrorCode } from "../../../common/errors";
import { hashPassword } from "../../utils";

const userMock = jest.fn();
const updateUserMock = jest.fn();

jest.mock("../../../generated/prisma-client", () => ({
  prisma: {
    user: jest.fn((...args) => userMock(...args)),
    updateUser: jest.fn((...args) => updateUserMock(...args))
  }
}));

describe("changePassword", () => {
  beforeEach(() => {
    userMock.mockReset();
    updateUserMock.mockReset();
  });

  it("should raise BAD_USER_INPU exception if hash comparison fails", async () => {
    userMock.mockResolvedValueOnce({
      password: await hashPassword("oldPassword")
    });
    expect.assertions(1);
    try {
      await changePassword("userId", "badOldPassword", "newPassword");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should update user with new hashed password", async () => {
    const hashedPassword = await hashPassword("oldPassword");
    userMock.mockResolvedValueOnce({
      password: hashedPassword
    });
    await changePassword("userId", "oldPassword", "newPassword");
    expect(updateUserMock).toHaveBeenCalled();
  });
});
