import { Request, Response, NextFunction } from "express";
import { impersonateMiddleware } from "../impersonate";
import { prisma } from "@td/prisma";

jest.mock("@td/prisma", () => ({
  ...jest.requireActual("@td/prisma"),
  prisma: {
    user: {
      findUniqueOrThrow: jest.fn()
    }
  }
}));

describe("impersonateMiddleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = { session: {} } as Request;
    res = {} as Response;
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not impersonate if user is not connected", async () => {
    await impersonateMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeUndefined();
  });

  it("should not impersonate if user has no session impersonation details", async () => {
    req.user = {
      id: "original-user-id",
      name: "Original User",
      isAdmin: false,
      auth: "SESSION"
    } as any;

    await impersonateMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user!.id).toBe("original-user-id");
  });

  it("should not impersonate if user is not admin", async () => {
    req.session = {
      impersonatedUserId: "impersonated-user-id",
      impersonationStartsAt: Date.now() - (60 * 60 * 1000 + 1), // Exceeds 1 hour
      warningMessage: "Impersonation warning"
    } as any;

    req.user = {
      id: "original-user-id",
      name: "Original User",
      isAdmin: false,
      auth: "SESSION"
    } as any;

    await impersonateMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user!.id).toBe("original-user-id");
  });

  it("should not impersonate if impersonation duration has exceeded", async () => {
    req.session = {
      impersonatedUserId: "impersonated-user-id",
      impersonationStartsAt: Date.now() - (60 * 60 * 1000 + 1), // Exceeds 1 hour
      warningMessage: "Impersonation warning"
    } as any;

    req.user = {
      id: "original-user-id",
      name: "Original User",
      isAdmin: true,
      auth: "SESSION"
    } as any;

    await impersonateMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.session.impersonatedUserId).toBeUndefined();
    expect(req.session.impersonationStartsAt).toBeUndefined();
    expect(req.session.warningMessage).toBeUndefined();
    expect(req.user!.id).toBe("original-user-id");
  });

  it("should impersonate if impersonation is active and duration is within limit", async () => {
    const impersonatedUser = {
      id: "impersonated-user-id",
      name: "Impersonated User",
      isAdmin: false
    };
    const originalUser = {
      id: "original-user-id",
      name: "Original User",
      isAdmin: true,
      auth: "SESSION"
    };

    req.session = {
      impersonatedUserId: "impersonated-user-id",
      impersonationStartsAt: Date.now(),
      warningMessage: "Impersonation warning"
    } as any;
    req.user = originalUser as any;

    jest
      .spyOn(prisma.user, "findUniqueOrThrow")
      .mockResolvedValueOnce(impersonatedUser as any);

    await impersonateMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.session.impersonatedUserId).toBe("impersonated-user-id");
    expect(req.session.impersonationStartsAt).toBeDefined();
    expect(req.session.warningMessage).toBe("Impersonation warning");
    expect(req.user).toEqual({ ...impersonatedUser, auth: originalUser.auth });
  });
});
