import {
  updateAccessTokenLastUsed,
  AuthType,
  applyAuthStrategies
} from "../auth";
import { AccessToken, User } from "../generated/prisma-client";
import { GraphQLContext } from "../types";

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
    const accessToken: AccessToken = {
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
    const accessToken: AccessToken = {
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
    const accessToken: AccessToken = {
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

describe("applyAuthStrategies", () => {
  it("should keep user in context if auth strategy is allowed", () => {
    const user: User = {
      id: "1",
      email: "john.snow@trackdechets.fr",
      password: "pass",
      createdAt: "",
      updatedAt: ""
    };
    const context: GraphQLContext = {
      user: { ...user, auth: AuthType.Session },
      req: null,
      res: null
    };
    applyAuthStrategies(context, [AuthType.Session]);
    expect(context.user).not.toBeNull();
  });

  it("should remove user from context if auth strategy is not allowed", () => {
    const user: User = {
      id: "1",
      email: "john.snow@trackdechets.fr",
      password: "pass",
      createdAt: "",
      updatedAt: ""
    };
    const context: GraphQLContext = {
      user: { ...user, auth: AuthType.Bearer },
      req: null,
      res: null
    };
    applyAuthStrategies(context, [AuthType.Session]);
    expect(context.user).toBeNull();
  });
});
