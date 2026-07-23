import {
  decodeInseeJwt,
  getPasswordAgeInDays,
  parsePwdChangedTime
} from "../jwt";

function createUnsignedJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" })
  ).toString("base64url");

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${header}.${body}.signature`;
}

describe("INSEE JWT", () => {
  it("décode pwdChangedTime", () => {
    const token = createUnsignedJwt({
      pwdChangedTime: "20260206145508Z"
    });

    expect(decodeInseeJwt(token)).toEqual({
      pwdChangedTime: "20260206145508Z"
    });
  });

  it("parse pwdChangedTime", () => {
    expect(parsePwdChangedTime("20260206145508Z").toISOString()).toBe(
      "2026-02-06T14:55:08.000Z"
    );
  });

  it("calcule l'âge du mot de passe", () => {
    const token = createUnsignedJwt({
      pwdChangedTime: "20260501120000Z"
    });

    const age = getPasswordAgeInDays(
      token,
      new Date("2026-07-22T12:00:00.000Z")
    );

    expect(age).toBe(82);
  });

  it("rejette un token invalide", () => {
    expect(() => decodeInseeJwt("invalid")).toThrow(
      "Le token INSEE n'est pas un JWT valide"
    );
  });
});
