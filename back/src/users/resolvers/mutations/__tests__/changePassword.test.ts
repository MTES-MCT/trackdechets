import { changePasswordFn as changePassword } from "../changePassword";
import { ErrorCode } from "../../../../common/errors";
import { hashPassword } from "../../../utils";

const userMock = jest.fn();
const updateUserMock = jest.fn();
const deleteManyMock = jest.fn();

jest.mock("@td/prisma", () => ({
  ...jest.requireActual("@td/prisma"),
  prisma: {
    user: {
      findUnique: jest.fn((...args) => userMock(...args)),
      update: jest.fn((...args) => updateUserMock(...args))
    },
    userResetPasswordHash: {
      deleteMany: jest.fn((...args) => deleteManyMock(...args))
    }
  }
}));

describe("changePassword", () => {
  beforeEach(() => {
    userMock.mockReset();
    updateUserMock.mockReset();
  });

  it("should raise BAD_USER_INPUT exception if hash comparison fails", async () => {
    userMock.mockResolvedValueOnce({
      password: await hashPassword("oldPassword")
    });
    expect.assertions(1);
    try {
      await changePassword("userId", {
        oldPassword: "badOldPassword",
        newPassword: "trackdechets#"
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
      newPassword: "Trackdechets1#"
    });
    expect(updateUserMock).toHaveBeenCalled();
  });
});
