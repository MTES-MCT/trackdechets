import { UserInputError } from "../../common/errors";
import {
  partiallyHideEmail,
  generatePassword,
  canSeeEmail,
  getEmailDomain,
  redactOrShowEmail,
  minimalPasswordLength,
  checkPasswordCriteria
} from "../utils";
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
    expect(t).toThrow("this must be a valid email");
  });
});

describe("canSeeEmail", () => {
  const userEmail = "walter.white@lospolloshermanos.com";
  it("should deny public providers", () => {
    expect(canSeeEmail("hector.salamanca@gmail.com", userEmail)).toEqual(false);
    expect(canSeeEmail("hector.salamanca@wanadoo.fr", userEmail)).toEqual(
      false
    );
  });

  it("should deny when user and admin emails have different domain name", () => {
    expect(canSeeEmail("hector.salamanca@mexicancartel.mx", userEmail)).toEqual(
      false
    );
  });

  it("should allow when user and admin emails have same domain name", () => {
    expect(
      canSeeEmail("mike.hermantraut@lospolloshermanos.com", userEmail)
    ).toEqual(true);
  });
});

describe("getEmailDomain", () => {
  it("should extract email domain", () => {
    expect(getEmailDomain("saul.goodman@bettercallsaul.com")).toEqual(
      "bettercallsaul.com"
    );
    expect(getEmailDomain("saul.goodman+extra@bettercallsaul.com")).toEqual(
      "bettercallsaul.com"
    );
    expect(getEmailDomain("saul@bettercallsaul.com")).toEqual(
      "bettercallsaul.com"
    );
    expect(getEmailDomain("saul@better.call.saul.com")).toEqual(
      "better.call.saul.com"
    );
  });
});

describe("redactOrShowEmail", () => {
  const userEmail = "walter.white@lospolloshermanos.com";
  it("should deny public providers", () => {
    expect(redactOrShowEmail("hector.salamanca@gmail.com", userEmail)).toEqual(
      "he****@gmail.com"
    );
    expect(redactOrShowEmail("hector.salamanca@wanadoo.fr", userEmail)).toEqual(
      "he****@wanadoo.fr"
    );
  });

  it("should deny when user and admin emails have different domain name", () => {
    expect(
      redactOrShowEmail("hector.salamanca@mexicancartel.mx", userEmail)
    ).toEqual("he****@mexicancartel.mx");
  });

  it("should allow when user and admin emails have same domain name", () => {
    expect(
      redactOrShowEmail("mike.hermantraut@lospolloshermanos.com", userEmail)
    ).toEqual("mike.hermantraut@lospolloshermanos.com");
  });
});

describe("generatePassword", () => {
  it("should generate a 12 characters password", () => {
    const pw = generatePassword();
    expect(pw.length).toEqual(minimalPasswordLength);
    expect(pw.toLowerCase()).toEqual(pw); // is lowercased ?
  });
});

describe("checkPasswordCriteria", () => {
  it("should accept a strong password", () => {
    checkPasswordCriteria("Trackdechets1#");
  });

  it("should throw on short passwords", () => {
    expect(() => {
      checkPasswordCriteria("toto");
    }).toThrow(UserInputError);
  });

  it("should throw on long passwords", () => {
    expect(() => {
      checkPasswordCriteria(
        "Lorem-ipsum-dolor-sit-amet-consectetur-adipiscing-elit-Ut-volutpat"
      );
    }).toThrow(UserInputError);
  });

  it("should throw on easy passwords", () => {
    expect(() => {
      checkPasswordCriteria("aaaaaaaaaaaa");
    }).toThrow(UserInputError);
  });
});
