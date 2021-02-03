import getReadableId, {
  ReadableIdPrefix,
  base32Encode,
  getRandomInt
} from "../readableId";

jest.mock("date-fns", () => ({
  format: jest.fn().mockReturnValue("20191004")
}));

describe("getReadableId", () => {
  it.each([
    ReadableIdPrefix.BSD,
    ReadableIdPrefix.DASRI,
    ReadableIdPrefix.HFC,
    ReadableIdPrefix.VHU
  ])("should return a well formatted readableId for %p", prefix => {
    const readableId = getReadableId(prefix);
    const regexp = new RegExp(`^${prefix}-20191004-[A-Z0-9]{9}$`);
    expect(readableId).toMatch(regexp);
  });
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
});

describe("getRandomInt", () => {
  it("should return a random number between 0 and $max", () => {
    const randomInt = getRandomInt(2);
    expect([0, 1, 2]).toContain(randomInt);
  });
});
