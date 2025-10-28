import { invalidSessionMiddleware } from "../invalidSessionMiddleware";
import { NextFunction } from "express";

jest.mock("../../../utils", () => ({
  getUIBaseURL: jest.fn(() => "http://example.com")
}));

describe("invalidSessionMiddleware", () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      session: { issuedAt: "2023-01-01T00:00:00.000Z" },
      user: { passwordUpdatedAt: new Date("2023-01-02T00:00:00.000Z") },
      logout: jest.fn(callback => callback(null))
    };
    res = {
      redirect: jest.fn()
    };
    next = jest.fn();
  });

  it("should call next() when session is valid", async () => {
    req.session.issuedAt = "2023-01-03T00:00:00.000Z"; // After password change

    await invalidSessionMiddleware(req, res, next);

    expect(req.logout).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should logout and redirect when no userPasswordChangedAt", async () => {
    req.user = undefined;

    await invalidSessionMiddleware(req, res, next);

    expect(req.logout).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("http://example.com");
    expect(next).not.toHaveBeenCalled();
  });

  it("should logout and redirect when session issued before password change", async () => {
    req.session.issuedAt = "2023-01-01T00:00:00.000Z"; // Before password change

    await invalidSessionMiddleware(req, res, next);

    expect(req.logout).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("http://example.com");
    expect(next).not.toHaveBeenCalled();
  });

  it("should logout and redirect when no session issuedAt", async () => {
    req.session.issuedAt = undefined;

    await invalidSessionMiddleware(req, res, next);

    expect(req.logout).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("http://example.com");
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle logout error", async () => {
    req.user = undefined;
    req.logout = jest.fn(callback => callback(new Error("Logout error")));

    await invalidSessionMiddleware(req, res, next);

    expect(req.logout).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(new Error("Logout error"));
  });
});
