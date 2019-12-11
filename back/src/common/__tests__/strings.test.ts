import { trim } from "../strings";

describe("trim", () => {
  it("should return a trimmed siret", () => {
    expect(trim("512 123456 00012")).toEqual("51212345600012");
    expect(trim("51212345600012")).toEqual("51212345600012");
  });
});
