import { cache } from "../cache";
import { resetCache } from "../../../../integration-tests/helper";
import { siretify } from "../../../__tests__/factories";

const siret = siretify(1);

const company = {
  siret,
  address: "4 Boulevard Longchamp 13001 Marseille",
  name: "CODE EN STOCK",
  naf: "62.01Z",
  libelleNaf: "Programmation informatique"
};

describe("searchCompany cached", () => {
  afterAll(() => resetCache());

  it("should cache company information", async () => {
    const searchCompany = jest.fn();
    searchCompany.mockResolvedValueOnce(company);
    const searchCompanyCached = cache(searchCompany);

    // call the function twice on the same siret
    const company1 = await searchCompanyCached(siret);
    const company2 = await searchCompanyCached(siret);
    expect(company1).toEqual(company);
    expect(company2).toEqual(company);

    // check searchCompany has been called only once
    expect(searchCompany).toHaveBeenCalledTimes(1);
  });
});
