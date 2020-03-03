import { isExpired } from "../oauth2";

describe("isExpired", () => {
  const RealDate = Date;

  afterEach(() => {
    Date = RealDate;
  });

  function mockDate(now: Date) {
    Date.now = jest.fn(() => now) as jest.Mock;
  }

  it("should return false if grant has not expired", () => {
    const grant = {
      id: "id",
      createdAt: "2019-10-04T20:00:00.000Z",
      updatedAt: "2019-10-04T20:00:00.000Z",
      expires: 10 * 60, // 10 minutes
      code: "code",
      redirectUri: "http://acme.inc/authorize"
    };
    const now = new Date("2019-10-04T20:05:00.000Z");
    mockDate(now);
    expect(isExpired(grant)).toBeFalsy();
  });

  it("should return true if grant has expired", () => {
    const grant = {
      id: "id",
      createdAt: "2019-10-04T20:00:00.000Z",
      updatedAt: "2019-10-04T20:00:00.000Z",
      expires: 10 * 60, // 10 minutes
      code: "code",
      redirectUri: "http://acme.inc/authorize"
    };
    const now = new Date("2019-10-04T20:15:00.000Z");
    mockDate(now);
    expect(isExpired(grant)).toBeTruthy();
  });
});
