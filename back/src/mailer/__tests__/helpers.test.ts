import { cleanupSpecialChars, toFrFormat } from "../helpers";

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
