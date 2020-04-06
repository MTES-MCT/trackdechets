import { getCachedCompanySireneInfo } from "../insee";
import { ErrorCode } from "../../common/errors";

import { searchCompanies } from "../insee";

// describe("getCachedCompanySireneInfo", () => {
//   it("should throw BAD_USER_INPUT error if \
//     the siret is not 14 character length", async () => {
//     expect.assertions(1);
//     try {
//       await getCachedCompanySireneInfo("invalide");
//     } catch (e) {
//       expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
//     }
//   });
// });

describe("searchCompanies", () => {
  it("should return companies based on a clue", async () => {
    const companies = await searchCompanies("boulangerie");
    expect(companies).toHaveLength(10);
  });
});
