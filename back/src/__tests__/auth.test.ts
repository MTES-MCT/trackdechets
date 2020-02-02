import { updateAccessTokenLastUsed } from "../auth";
import { AccessToken } from "../generated/prisma-client";

const updateAccessTokenMock = jest.fn();
jest.mock("../generated/prisma-client", () => ({
  prisma: {
    updateAccessToken: jest.fn((...args) => updateAccessTokenMock(...args))
  }
}));

describe("updateAccessTokenLastUsed", () => {
  const RealDate = Date;
  const now = new Date("2019-10-04T20:00:00.000Z");

  function mockDate() {
    Date.now = jest.fn(() => now) as jest.Mock;
  }

  afterEach(() => {
    updateAccessTokenMock.mockReset();
    Date = RealDate;
  });

  it("should set lastUsed if it was never set", () => {
    mockDate();
    let accessToken: AccessToken = {
      id: "",
      createdAt: "",
      updatedAt: "",
      token: "token",
      lastUsed: null,
      isRevoked: false
    };

    // it should set lastUsed if it was never set
    updateAccessTokenLastUsed(accessToken);
    expect(updateAccessTokenMock).toHaveBeenCalledWith({
      data: { lastUsed: "2019-10-04T00:00:00.000Z" },
      where: { token: "token" }
    });
  });

  it("should not set lastUsed if it was already set the same day", () => {
    let accessToken: AccessToken = {
      id: "",
      createdAt: "",
      updatedAt: "",
      token: "token",
      lastUsed: "2019-10-04T00:00:00.000Z",
      isRevoked: false
    };
    updateAccessTokenLastUsed(accessToken);
    expect(updateAccessTokenMock).not.toBeCalled();
  });

  it("should set lastUsed if it was set more than one day ago", () => {
    let accessToken: AccessToken = {
      id: "",
      createdAt: "",
      updatedAt: "",
      token: "token",
      lastUsed: "2019-10-02T00:00:00.000Z",
      isRevoked: false
    };
    updateAccessTokenLastUsed(accessToken);
    expect(updateAccessTokenMock).toHaveBeenCalledWith({
      data: { lastUsed: "2019-10-04T00:00:00.000Z" },
      where: { token: "token" }
    });
  });
});
