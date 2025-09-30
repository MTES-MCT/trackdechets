import { Grant } from "@td/prisma";
import { isExpired } from "../oauth/utils";

describe("isExpired", () => {
  const RealDate = Date;

  afterEach(() => {
    Date = RealDate;
  });

  function mockDate(now: Date) {
    Date.now = jest.fn(() => now) as jest.Mock;
  }

  it("should return false if grant has not expired", () => {
    const grant: Partial<Grant> = {
      id: "id",
      createdAt: new Date("2019-10-04T20:00:00.000Z"),
      updatedAt: new Date("2019-10-04T20:00:00.000Z"),
      expires: 10 * 60, // 10 minutes
      code: "code",
      redirectUri: "http://acme.inc/authorize"
    };
    const now = new Date("2019-10-04T20:05:00.000Z");
    mockDate(now);
    expect(isExpired(grant as Grant)).toBeFalsy();
  });

  it("should return true if grant has expired", () => {
    const grant: Partial<Grant> = {
      id: "id",
      createdAt: new Date("2019-10-04T20:00:00.000Z"),
      updatedAt: new Date("2019-10-04T20:00:00.000Z"),
      expires: 10 * 60, // 10 minutes
      code: "code",
      redirectUri: "http://acme.inc/authorize"
    };
    const now = new Date("2019-10-04T20:15:00.000Z");
    mockDate(now);
    expect(isExpired(grant as Grant)).toBeTruthy();
  });
});
