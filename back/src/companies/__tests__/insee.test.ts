import { getCachedCompanySireneInfo } from "../insee";
import { ErrorCode } from "../../common/errors";

describe("getCachedCompanySireneInfo", () => {
  it("should throw BAD_USER_INPUT error if \
    the siret is not 14 character length", async () => {
    expect.assertions(1);
    try {
      await getCachedCompanySireneInfo("invalide");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });
});
