import { trimSiret } from "../sirets";

describe("trimSiret", () => {
  it("should return a trimmed siret", () => {
    expect(trimSiret("512 123456 00012")).toEqual("51212345600012");
    expect(trimSiret("51212345600012")).toEqual("51212345600012");
  });
});
