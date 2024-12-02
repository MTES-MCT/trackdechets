import {
  getUid,
  sameDayMidnight,
  daysBetween,
  base32Encode,
  hashToken,
  xDaysAgo,
  randomNbrChain,
  removeSpecialCharsExceptHyphens,
  inXDays
} from "../utils";

test("getUid returns a unique identifier of fixed length", () => {
  const uid = getUid(10);
  expect(uid).toHaveLength(10);
});

test("sameDayMidnight convert a date to same day at midnight", () => {
  const date = new Date("2019-10-04T20:43:00");
  const midnight = sameDayMidnight(date);
  const expected = new Date("2019-10-04T00:00:00");
  expect(midnight).toEqual(expected);
});

test("daysBetween should calculate the number of days between two dates", () => {
  const date1 = new Date("2019-10-04T20:43:00");
  const date2 = new Date("2019-10-01T09:00:00");
  const days = daysBetween(date1, date2);
  expect(days).toEqual(3);
});

describe("base32Encode", () => {
  it("should base32Encode a number", () => {
    expect(base32Encode(0)).toEqual("0");
    expect(base32Encode(1)).toEqual("1");
    expect(base32Encode(9)).toEqual("9");
    expect(base32Encode(10)).toEqual("A");
    expect(base32Encode(31)).toEqual("Z");
    expect(base32Encode(32)).toEqual("10");
    expect(base32Encode(Math.pow(32, 9) - 1)).toEqual("ZZZZZZZZZ");
  });

  test("hashToken", () => {
    const OLD_ENV = process.env;
    process.env.API_TOKEN_SECRET = "loremipsum";
    const someToken = "xyzef1234";

    expect(hashToken(someToken)).toEqual(
      "97706c213b37c5347a40da50f4ae1f34ef18503cd4ef33fd5e2780b0ed0bb3a7"
    );
    process.env = { ...OLD_ENV };
  });
});

describe("xDaysAgo", () => {
  it("should return a relative past date", () => {
    const someDate = new Date("2019-10-03T00:00:00.000Z");
    const threeDaysBefore = xDaysAgo(someDate, 3);
    expect(threeDaysBefore).toEqual(new Date("2019-09-30T00:00:00.000Z"));
  });
});

describe("inXDays", () => {
  it("should return a date in x days", () => {
    const someDate = new Date("2019-10-03T10:00:00.000Z");
    const threeDaysLater = inXDays(someDate, 3);
    expect(threeDaysLater).toEqual(new Date("2019-10-06T00:00:00.000Z"));
  });
});

describe("randomNbrChain", () => {
  it("should generate random chain of numbers", async () => {
    // Given
    const length = 10;

    // When
    const chain = randomNbrChain(length);

    // Then
    expect(chain.length).toEqual(length);
    // Numbers only
    expect(new RegExp(/^\d+$/).test(chain)).toBeTruthy();
  });
});

describe("removeSpecialCharsExceptHyphens", () => {
  test.each`
    input                                                                   | expected
    ${""}                                                                   | ${""}
    ${"text"}                                                               | ${"text"}
    ${"text with spaces"}                                                   | ${"text with spaces"}
    ${"text with accents éèàçùÉ"}                                           | ${"text with accents éèàçùÉ"}
    ${"text-with-hyphens"}                                                  | ${"text-with-hyphens"}
    ${"/[~`!@#$%^&*()+={}[];:'\"<>.,/?_]"}                                  | ${""}
    ${"/[~`!@#$%^&*()+={}[];:'\"<>.,/?_]/[~`!@#$%^&*()+={}[];:'\"<>.,/?_]"} | ${""}
    ${"/[~`!@#$%^and some&*()+={}[];:'\" text in between<>.,/?_]"}          | ${"and some text in between"}
  `('"$input" should return $expected', ({ input, expected }) => {
    expect(removeSpecialCharsExceptHyphens(input)).toEqual(expected);
  });
});
