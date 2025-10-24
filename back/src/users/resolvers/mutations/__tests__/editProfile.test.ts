import { editProfileFn as editProfile } from "../editProfile";
import configureYup from "../../../../common/yup/configureYup";

configureYup();

const mockUpdateUser = jest.fn();

jest.mock("@td/prisma", () => ({
  ...jest.requireActual("@td/prisma"),
  prisma: {
    user: { update: jest.fn((...args) => mockUpdateUser(...args)) }
  }
}));

describe("editProfile", () => {
  beforeEach(() => {
    mockUpdateUser.mockReset();
  });

  it("should allow setting fields", async () => {
    await editProfile("userId", { name: "John Doe" });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      where: { id: "userId" },
      data: { name: "John Doe" }
    });
  });
});
