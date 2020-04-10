import makeClient from "../../../__tests__/testClient";
import { resetDatabase } from "../../../../integration-tests/helper";

// jest.mock("../../insee", () => ({
//   searchCompany: jest.fn(() => Promise.resolve())
// }));

describe("query { companyInfos(siret: <SIRET>) }", () => {
  afterEach(() => resetDatabase());

  const { query } = makeClient(null);

  const siret = "85001946400013 ";

  it("should return companyInfos", async () => {
    const gqlquery = `
      query {
        companyInfos(siret: "${siret}") {
          siret
          name
        }
      }`;
    const response = await query(gqlquery);
    console.log(response);
  });
});
