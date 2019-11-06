import { parseBearerToken } from "../auth";
import { sign } from "jsonwebtoken";
import { ErrorCode } from "../common/errors";

describe("parseBearerToken", () => {
  it("parse token from a well formed Bearer authorization header", () => {
    const authHeader = "Bearer myToken";
    const token = parseBearerToken(authHeader);
    expect(token).toEqual("myToken");
  });

  it("return null if the authorization scheme is not Bearer", () => {
    const authHeader = "Basic base64loginPwd";
    const token = parseBearerToken(authHeader);
    expect(token).toBe(null);
  });

  it("return null if the header is malformed", () => {
    const authHeader = "malformed";
    const token = parseBearerToken(authHeader);
    expect(token).toBe(null);
  });
});

describe("getUserIdFromToken", () => {
  // tweak and restore process.env after each test
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules(); //   clears the cache
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("decode a valid token", () => {
    process.env.JWT_SECRET = "secret";

    // import function from each test to take into account
    // tweaked process.env
    const getUserIdFromToken = require("../auth").getUserIdFromToken;

    const token = sign({ userId: "userId" }, "secret", { expiresIn: "1d" });
    const userId = getUserIdFromToken(token);
    expect(userId).toEqual("userId");
  });

  it("returns null if the token is not valid", () => {
    process.env.JWT_SECRET = "secret";
    const getUserIdFromToken = require("../auth").getUserIdFromToken;

    expect(getUserIdFromToken("invalidToken")).toBe(null);
  });

  it("returns null if the token is expired", () => {
    process.env.JWT_SECRET = "secret";
    const getUserIdFromToken = require("../auth").getUserIdFromToken;
    const token = sign({ userId: "userId" }, "secret", { expiresIn: "1ms" });
    expect(getUserIdFromToken(token)).toBe(null);
  });
});
