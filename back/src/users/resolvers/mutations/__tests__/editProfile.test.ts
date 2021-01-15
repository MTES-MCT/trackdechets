import { editProfileFn as editProfile } from "../editProfile";

const mockUpdateUser = jest.fn();

jest.mock("../../../../prisma", () => ({
  user: { update: jest.fn((...args) => mockUpdateUser(...args)) }
}));

describe("editProfile", () => {
  beforeEach(() => {
    mockUpdateUser.mockReset();
  });

  it("should allow setting fields to empty string", async () => {
    await editProfile("userId", { name: "" });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      where: { id: "userId" },
      data: { name: "" }
    });
  });

  it("should allow setting fields to null value", async () => {
    await editProfile("userId", { name: null });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      where: { id: "userId" },
      data: { name: null }
    });
  });
});
