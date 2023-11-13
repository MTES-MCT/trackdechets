import { libsBackMail } from "./libs/back/mail";

describe("libsBackMail", () => {
  it("should work", () => {
    expect(libsBackMail()).toEqual("libs/back/mail");
  });
});
