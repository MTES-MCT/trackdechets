import { searchCompany } from "..";
import { ErrorCode } from "../../../common/errors";

describe("searchCompany", () => {
  it(`should throw BAD_USER_INPUT error if
    the siret is not 14 character length`, async () => {
    expect.assertions(1);
    try {
      await searchCompany("invalide");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });
});
