import {
  userWithCompanyFactory,
  userFactory,
  companyFactory
} from "../../__tests__/factories";
import { checkIsCompanyAdmin } from "../permissions";
import { ErrorCode } from "../../common/errors";

describe("checkIsAdmin", () => {
  it("should return true if user is admin of the company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const check = await checkIsCompanyAdmin(user, company);
    expect(check).toEqual(true);
  });

  it("should throw ForbiddenError if user is member of the company", async () => {
    expect.assertions(2);
    const { user, company } = await userWithCompanyFactory("MEMBER");
    try {
      await checkIsCompanyAdmin(user, company);
    } catch (err) {
      expect(err.extions.code).toEqual(ErrorCode.FORBIDDEN);
      expect(err.message).toEqual(
        `Vous n'êtes pas administrateur de l'entreprise portant le siret "${company.siret}".`
      );
    }
  });

  it("should throw ForbiddenError if user has nothing to do with company", async () => {
    expect.assertions(2);
    const user = await userFactory();
    const company = await companyFactory();
    try {
      await checkIsCompanyAdmin(user, company);
    } catch (err) {
      expect(err.extions.code).toEqual(ErrorCode.FORBIDDEN);
      expect(err.message).toEqual(
        `Vous n'êtes pas administrateur de l'entreprise portant le siret "${company.siret}".`
      );
    }
  });
});
