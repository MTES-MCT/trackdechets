import {
  updateAccessTokenLastUsed,
  AuthType,
  applyAuthStrategies
} from "../auth/auth";
import { AccessToken, User } from "@td/prisma";
import { GraphQLContext } from "../types";
import { sameDayMidnight } from "../utils";

const updateAccessTokenMock = jest.fn();
jest.mock("@td/prisma", () => ({
  ...jest.requireActual("@td/prisma"),
  prisma: {
    accessToken: {
      update: jest.fn((...args) => updateAccessTokenMock(...args))
    }
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
      createdAt: new Date(),
      updatedAt: new Date(),
      token: "token",
      description: null,
      lastUsed: null,
      isRevoked: false,
      applicationId: null,
      userId: ""
    };

    // it should set lastUsed if it was never set
    updateAccessTokenLastUsed(accessToken);
    expect(updateAccessTokenMock).toHaveBeenCalledWith({
      data: { lastUsed: sameDayMidnight(now) },
      where: { token: "token" }
    });
  });

  it("should not set lastUsed if it was already set the same day", () => {
    const accessToken: AccessToken = {
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      token: "token",
      description: null,
      lastUsed: new Date("2019-10-04T00:00:00.000Z"),
      isRevoked: false,
      applicationId: null,
      userId: ""
    };
    updateAccessTokenLastUsed(accessToken);
    expect(updateAccessTokenMock).not.toHaveBeenCalled();
  });

  it("should set lastUsed if it was set more than one day ago", () => {
    const accessToken: AccessToken = {
      id: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      token: "token",
      description: null,
      lastUsed: new Date("2019-10-02T00:00:00.000Z"),
      isRevoked: false,
      applicationId: null,
      userId: ""
    };
    updateAccessTokenLastUsed(accessToken);
    expect(updateAccessTokenMock).toHaveBeenCalledWith({
      data: { lastUsed: sameDayMidnight(now) },
      where: { token: "token" }
    });
  });
});

describe("applyAuthStrategies", () => {
  it("should keep user in context if auth strategy is allowed", () => {
    const user: Partial<User> = {
      id: "1",
      email: "john.snow@trackdechets.fr",
      password: "pass",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const context: GraphQLContext = {
      user: { ...(user as User), auth: AuthType.Session },
      req: null as any,
      res: null as any,
      dataloaders: null as any
    };
    applyAuthStrategies(context, [AuthType.Session]);
    expect(context.user).not.toBeNull();
  });

  it("should remove user from context if auth strategy is not allowed", () => {
    const user: Partial<User> = {
      id: "1",
      email: "john.snow@trackdechets.fr",
      password: "pass",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const context: GraphQLContext = {
      user: { ...(user as User), auth: AuthType.Bearer },
      req: null as any,
      res: null as any,
      dataloaders: null as any
    };
    applyAuthStrategies(context, [AuthType.Session]);
    expect(context.user).toBeNull();
  });
});
