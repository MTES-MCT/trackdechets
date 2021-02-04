import getReadableId, { ReadableIdPrefix, getRandomInt } from "../readableId";

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

describe("getRandomInt", () => {
  it("should return a random number between 0 and $max", () => {
    const randomInt = getRandomInt(2);
    expect([0, 1, 2]).toContain(randomInt);
  });
});
