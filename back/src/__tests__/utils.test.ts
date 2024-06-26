import {
  getUid,
  sameDayMidnight,
  daysBetween,
  base32Encode,
  hashToken,
  extractPostalCode,
  xDaysAgo,
  randomNbrChain,
  removeSpecialCharsExceptHyphens,
  splitAddress
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

  test("when there are multiple matches, should return the last one", () => {
    const address = "134 AV DU GENERAL EISENHOWER CS 42326 31100 TOULOUSE";
    expect(extractPostalCode(address)).toEqual("31100");
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

describe("splitAddress", () => {
  test.each([
    [
      "",
      {
        street: "",
        postalCode: "",
        city: ""
      }
    ],
    [
      null,
      {
        street: "",
        postalCode: "",
        city: ""
      }
    ],
    [
      undefined,
      {
        street: "",
        postalCode: "",
        city: ""
      }
    ],
    [
      "VIA A NASSETTI SNC PALAZZO ALFA 00054 FIUMICINO RM",
      {
        street: "VIA A NASSETTI SNC PALAZZO ALFA",
        postalCode: "00054",
        city: "FIUMICINO RM"
      }
    ],
    // Foreign postal code - not handled yet
    [
      "IZ Noe Sued Str 14 AT-2355 Wiener Neudorf",
      {
        street: "",
        postalCode: "",
        city: ""
      }
    ],
    [
      "1 RUE DE L'HOTEL DE VILLE 17000 LA ROCHELLE",
      {
        street: "1 RUE DE L'HOTEL DE VILLE",
        postalCode: "17000",
        city: "LA ROCHELLE"
      }
    ],
    [
      "2 RUE PIERRE BROSSOLETTE 64000 PAU",
      { street: "2 RUE PIERRE BROSSOLETTE", postalCode: "64000", city: "PAU" }
    ],
    [
      "34 ROUTE DE BRESSUIRE 79200 CHATILLON-SUR-THOUET",
      {
        street: "34 ROUTE DE BRESSUIRE",
        postalCode: "79200",
        city: "CHATILLON-SUR-THOUET"
      }
    ],
    [
      "2 RUE ROUGEMONT 14/16 BD POISSONNIERE 75009 PARIS 9",
      {
        street: "2 RUE ROUGEMONT 14/16 BD POISSONNIERE",
        postalCode: "75009",
        city: "PARIS 9"
      }
    ],
    [
      "ZI DES AJONCS 85000 LA ROCHE-SUR-YON",
      {
        street: "ZI DES AJONCS",
        postalCode: "85000",
        city: "LA ROCHE-SUR-YON"
      }
    ],
    [
      "   ZI DES       AJONCS 85000        LA ROCHE-SUR-YON       ",
      {
        street: "ZI DES AJONCS",
        postalCode: "85000",
        city: "LA ROCHE-SUR-YON"
      }
    ],
    // Misleading example with postalCode-like number in it
    [
      "109 AV DU GENERAL EISENHOWER CS 42326 31100 TOULOUSE",
      {
        street: "109 AV DU GENERAL EISENHOWER CS 42326",
        postalCode: "31100",
        city: "TOULOUSE"
      }
    ]
  ])("%p should return %p", (address, expected) => {
    // When
    const splitted = splitAddress(address);

    // Then
    expect(splitted).toMatchObject(expected);
  });
});
