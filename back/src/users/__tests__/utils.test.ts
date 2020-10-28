import { partiallyHideEmail } from "../utils";

describe("partiallyHideEmail", () => {
  it("should partially hide a well formatted email address", () => {
    const hidden = partiallyHideEmail("john.snow@trackdechets.fr");
    expect(hidden).toEqual("jo****@trackdechets.fr");
  });

  it("should partially hide email with short user part", () => {
    let hidden = partiallyHideEmail("a@trackdechets.fr");
    expect(hidden).toEqual("a****@trackdechets.fr");
    hidden = partiallyHideEmail("aa@trackdechets.fr");
    expect(hidden).toEqual("aa****@trackdechets.fr");
    hidden = partiallyHideEmail("aaa@trackdechets.fr");
    expect(hidden).toEqual("aa****@trackdechets.fr");
  });

  it("should throw an error if string is not an email", () => {
    const t = () => partiallyHideEmail("this is not an email");
    expect(t).toThrowError("this must be a valid email");
  });
});
