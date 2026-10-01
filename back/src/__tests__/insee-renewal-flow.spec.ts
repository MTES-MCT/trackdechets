import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../common/redis", () => ({
  redisClient: {
    get: jest.fn(async () => null),
    set: jest.fn(async () => "OK"),
    unlink: jest.fn(async () => 1),
    pipeline: jest.fn().mockReturnValue({
      incr: jest.fn(),
      expire: jest.fn(),
      exec: jest.fn()
    })
  },
  setInCache: jest.fn(async () => "OK")
}));

import {
  INSEE_PASSWORD_RENEWAL_MARGIN_MS,
  INSEE_PASSWORD_VALIDITY_MS,
  parsePwdChangedTime,
  shouldRenewInseePassword
} from "../companies/sirene/insee/token";

function encodeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" })
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

describe("INSEE renewal flow", () => {
  it("does not renew when pwdChangedTime is still within validity window", () => {
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const jwt = encodeJwt({
      pwdChangedTime: recentDate
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z")
    });

    expect(parsePwdChangedTime("20251001093015Z")).not.toBeNull();
    expect(shouldRenewInseePassword(jwt)).toBe(false);
  });

  it("renews when pwdChangedTime is older than the renewal threshold", () => {
    const expiredDate = new Date(
      Date.now() - (INSEE_PASSWORD_VALIDITY_MS + 1 * 24 * 60 * 60 * 1000)
    );
    const jwt = encodeJwt({
      pwdChangedTime: expiredDate
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z")
    });

    expect(shouldRenewInseePassword(jwt)).toBe(true);
  });

  it("starts renewal before the password validity window ends", () => {
    const nearExpiryDate = new Date(
      Date.now() -
        (INSEE_PASSWORD_VALIDITY_MS -
          INSEE_PASSWORD_RENEWAL_MARGIN_MS +
          60 * 60 * 1000)
    );
    const jwt = encodeJwt({
      pwdChangedTime: nearExpiryDate
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}Z$/, "Z")
    });

    expect(shouldRenewInseePassword(jwt)).toBe(true);
  });
});
