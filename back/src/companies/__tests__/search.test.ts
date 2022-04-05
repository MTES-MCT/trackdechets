import { makeSearchCompanies, searchCompany } from "../search";
import { ErrorCode } from "../../common/errors";

describe("searchCompany", () => {
  it(`should throw BAD_USER_INPUT error if
    the clue is not a valid VAT number`, async () => {
    expect.assertions(1);
    try {
      await searchCompany("XX123");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });

  it(`should throw BAD_USER_INPUT error if
  the siret is not 14 character length`, async () => {
    expect.assertions(1);
    try {
      await searchCompany("1234");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });

  it(`should throw BAD_USER_INPUT error if
  the vat number starts with FR`, async () => {
    expect.assertions(1);
    try {
      await searchCompany("FR1234");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });
});

describe("searchCompanies", () => {
  const searchCompanyMock = jest.fn();
  const searchCompanies = makeSearchCompanies({
    searchCompany: searchCompanyMock
  });

  beforeEach(() => {
    searchCompanyMock.mockReset();
  });

  it("should call searchCompany when the clue is formatted like a SIRET", async () => {
    const company = {
      siret: "11111111111111",
      name: "ACME",
      naf: "NAF",
      libelleNaf: "Autres activités",
      codeCommune: "13001",
      address: "40 boulevard Voltaire 13001 Marseille",
      addressVoie: "40 boulevard",
      addressCity: "Marseille",
      addressPostalCode: "13001",
      etatAdministratif: "A"
    };
    searchCompanyMock.mockResolvedValue(company);
    const companies = await searchCompanies("11111111111111");
    expect(searchCompanyMock).toHaveBeenCalledWith("11111111111111");
    expect(companies[0]).toStrictEqual(company);
  });

  it("should not call searchCompany when the clue is formatted like a VAT number", async () => {
    const company = {
      siret: "11111111111111",
      vatNumber: "IT09301420155",
      name: "ACME",
      naf: "NAF",
      libelleNaf: "Autres activités",
      codeCommune: "13001",
      address: "40 boulevard Voltaire 13001 Marseille",
      addressVoie: "40 boulevard",
      addressCity: "Marseille",
      addressPostalCode: "13001",
      etatAdministratif: "A"
    };
    searchCompanyMock.mockResolvedValue(company);
    await searchCompanies("IT09301420155");
    expect(searchCompanyMock).toHaveBeenCalledTimes(0);
  });

  it(`should not return closed companies when searching by SIRET`, async () => {
    searchCompanyMock.mockResolvedValue({
      siret: "11111111111111",
      name: "ACME",
      naf: "NAF",
      libelleNaf: "Autres activités",
      codeCommune: "13001",
      address: "40 boulevard Voltaire 13001 Marseille",
      addressVoie: "40 boulevard",
      addressCity: "Marseille",
      addressPostalCode: "13001",
      etatAdministratif: "F"
    });
    const companies = await searchCompanies("11111111111111");
    expect(searchCompanyMock).toHaveBeenCalledWith("11111111111111");
    expect(companies).toStrictEqual([]);
  });

  it(`should return [] if SIRET does not exist when searching by SIRET`, async () => {
    searchCompanyMock.mockRejectedValue(new Error("Not found"));
    const companies = await searchCompanies("11111111111111");
    expect(searchCompanyMock).toHaveBeenCalledWith("11111111111111");
    expect(companies).toStrictEqual([]);
  });
});
