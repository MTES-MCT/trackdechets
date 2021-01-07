import { changePasswordFn as changePassword } from "../changePassword";
import { ErrorCode } from "../../../../common/errors";
import { hashPassword } from "../../../utils";

const userMock = jest.fn();
const updateUserMock = jest.fn();

jest.mock("src/prisma", () => ({
  user: {
    findOne: jest.fn((...args) => userMock(...args)),
    update: jest.fn((...args) => updateUserMock(...args))
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
      await changePassword("userId", {
        oldPassword: "badOldPassword",
        newPassword: "newPassword"
      });
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });

  it("should update user with new hashed password", async () => {
    const hashedPassword = await hashPassword("oldPassword");
    userMock.mockResolvedValueOnce({
      password: hashedPassword
    });
    await changePassword("userId", {
      oldPassword: "oldPassword",
      newPassword: "newPassword"
    });
    expect(updateUserMock).toHaveBeenCalled();
  });
});
