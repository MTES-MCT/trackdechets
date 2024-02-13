import {
  getUid,
  sameDayMidnight,
  daysBetween,
  base32Encode,
  hashToken,
  extractPostalCode,
  xDaysAgo,
  randomNbrChain,
  isEmail,
  isGenericEmail,
  GENERIC_EMAIL_DOMAINS
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

describe("extractPostalCode", () => {
  test("when there is a match", () => {
    const address = "3 route du déchet, 07100 Annonay";
    expect(extractPostalCode(address)).toEqual("07100");
  });

  test("when there is not match", () => {
    expect(extractPostalCode("Somewhere")).toEqual("");
  });

  test("when address is empty", () => {
    expect(extractPostalCode("")).toEqual("");
  });

  test("when address is null", () => {
    expect(extractPostalCode(null)).toEqual("");
  });
});

describe("xDaysAgo", () => {
  it("should return a relative past date", () => {
    const someDate = new Date("2019-10-03T00:00:00.000Z");
    const threeDaysBefore = xDaysAgo(someDate, 3);
    expect(threeDaysBefore).toEqual(new Date("2019-09-30T00:00:00.000Z"));
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

describe("isEmail", () => {
  test.each`
    input                         | expected
    ${"abc..def@mail.com"}        | ${false}
    ${"abc.def@mail.c"}           | ${false}
    ${"abc.def@mail#archive.com"} | ${false}
    ${"abc.def@mail"}             | ${false}
    ${"abc.def@mail..com"}        | ${false}
    ${"abc-d@mail.com"}           | ${true}
    ${"abc.def@mail.com"}         | ${true}
    ${"abc@mail.com"}             | ${true}
    ${"abc_def@mail.com"}         | ${true}
    ${"abc.def@mail.cc"}          | ${true}
    ${"abc.def@mail-archive.com"} | ${true}
    ${"abc.def@mail.org"}         | ${true}
    ${"abc.def@mail.com"}         | ${true}
  `('"$input" should return $expected', ({ input, expected }) => {
    expect(isEmail(input)).toEqual(expected);
  });
});

describe("isGenericEmail", () => {
  test.each([
    ...GENERIC_EMAIL_DOMAINS.map(domain => `giovanni.giorgio@${domain}.fr`),
    ...GENERIC_EMAIL_DOMAINS.map(domain => `giovanni.giorgio@${domain}.com`),
    ...GENERIC_EMAIL_DOMAINS.map(domain =>
      `giovanni.giorgio@${domain}.de`.toUpperCase()
    )
  ])(`%p is generic because domain belongs to the generic list`, email => {
    expect(isGenericEmail(email)).toEqual(true);
  });

  test.each([
    "giovanni.giorgio@veolia.fr",
    "jeff@dechets.com",
    "jack.sparrow@entreprise-btp.be"
  ])(`%p is NOT generic because domain is not in the generic list`, email => {
    expect(isGenericEmail(email)).toEqual(false);
  });

  test.each([
    "giovanni.giorgio@orange.orange.fr",
    "giovanni.giorgio@orange.laposte.fr",
    "giovanni.giorgio@orangelaposte.fr",
    "giovanni.giorgio@orangeraie.fr"
  ])(`%p is NOT generic - edge cases`, email => {
    expect(isGenericEmail(email)).toEqual(false);
  });

  test.each([
    ["giovanni.giorgio@orange.fr", "L'orange niçoise"],
    ["jeff@gmail.com", "Gmail déchetterie"],
    ["jack.sparrow@yahoo.be", "Yahoo on kiffe les déchets SAS"]
  ])(
    `%p is NOT generic because email domain, even though generic, refers to company name %p`,
    (email, companyName) => {
      expect(isGenericEmail(email, companyName)).toEqual(false);
    }
  );

  test.each([
    // Hyphens
    ["giovanni.giorgio@orange-nicoise.fr"],
    ["jeff@gmail-dechetterie.com"],
    ["jack.sparrow@kiff-yahoo-dechets.be"],
    // Dots
    ["giovanni.giorgio@orange.nicoise.fr"],
    ["jeff@gmail.dechetterie.com"],
    ["jack.sparrow@kiff.yahoo.dechets.be"]
  ])(`%p is NOT generic because of complex domain`, email => {
    expect(isGenericEmail(email)).toEqual(false);
  });
});
