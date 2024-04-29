import {
  cleanupSpecialChars,
  sanitize,
  splitArrayIntoChunks,
  toFrFormat
} from "../helpers";

describe("cleanupSpecialChars", () => {
  it("should return name cleaned from some special chars", () => {
    expect(cleanupSpecialChars("JEAN*VALJEAN/")).toEqual("JEAN VALJEAN");
    expect(cleanupSpecialChars("SARL DECHETS-DU-MIDI")).toEqual(
      "SARL DECHETS-DU-MIDI"
    );
    expect(cleanupSpecialChars(null)).toEqual("");
    expect(cleanupSpecialChars(undefined)).toEqual("");
  });
});

describe("toFrFormat", () => {
  it("should return a date formatted according to fr format", () => {
    expect(toFrFormat(new Date(2019, 3, 29))).toEqual("29 avril 2019");
  });
});

describe("splitArrayIntoChunks", () => {
  it("should return an array of arrays of max size maxChunkSize", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const res = splitArrayIntoChunks(arr, 3);

    expect(res[0]).toEqual([1, 2, 3]);
    expect(res[1]).toEqual([4, 5, 6]);
    expect(res[2]).toEqual([7, 8, 9]);
    expect(res[3]).toEqual([10]);
  });

  it("should work with empty array", () => {
    const arr = [];

    const res = splitArrayIntoChunks(arr, 3);

    expect(res[0]).toEqual([]);
  });

  it("should work is maxChunkSize > array.length", () => {
    const arr = [1, 2, 3];

    const res = splitArrayIntoChunks(arr, 10);

    expect(res[0]).toEqual([1, 2, 3]);
  });
});

describe("sanitize", () => {
  // Base on the payloads at https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection
  test.each`
    input             | expected
    ${"John Doe"}     | ${"John Doe"}
    ${"John-Doe"}     | ${"John-Doe"}
    ${"John_Doe"}     | ${"John_Doe"}
    ${"john@doe.com"} | ${"john@doe.com"}
    ${"Jöhn Dôe"}     | ${"Jöhn Dôe"}
    ${"j0hn D03"}     | ${"j0hn D03"}
    ${"{{7*7}}}}"}    | ${"77"}
    ${"${7*7}"}       | ${"77"}
    ${"<%=7*7%>"}     | ${"77"}
    ${"${{7*7}}"}     | ${"77"}
    ${"#{7*7}"}       | ${"77"}
    ${"*{7*7}"}       | ${"77"}
  `("$input should become $expected", ({ input, expected }) => {
    expect(sanitize(input)).toEqual(expected);
  });
});
