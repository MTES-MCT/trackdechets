import { makeSearchCompanies, searchCompany } from "../search";
import { ErrorCode } from "../../common/errors";
import prisma from "../../prisma";
import { siretify } from "../../__tests__/factories";

const createInput = {
  siret: siretify(3),
  name: "Établissement de test",
  address: "Adresse test",
  codeNaf: "XXXXX",
  libelleNaf: "Entreprise de test",
  codeCommune: "00000"
};

jest.mock("../../prisma", () => ({
  anonymousCompany: {
    create: jest.fn(() => Promise.resolve(createInput)),
    findUnique: jest.fn(() => Promise.resolve(createInput))
  },
  company: {
    findUnique: jest.fn(() => Promise.resolve(null))
  }
}));

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

  it(`should not allow test company when env var ALLOW_TEST_COMPANY is not true`, async () => {
    const OLD_ENV = process.env;
    process.env.ALLOW_TEST_COMPANY = "false";
    // re-load variables with custom env
    jest.resetModules();
    expect.assertions(1);
    try {
      await searchCompany("00000012354659");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
    process.env = OLD_ENV;
  });

  it(`should allow searching test company when env var ALLOW_TEST_COMPANY is setup`, async () => {
    const OLD_ENV = process.env;
    process.env.ALLOW_TEST_COMPANY = "true";
    // re-load variables with custom env
    jest.resetModules();

    const { siret } = await prisma.anonymousCompany.create({
      data: {
        orgId: createInput.siret,
        ...createInput
      }
    });
    const testCompany = await searchCompany(siret);
    expect(siret).toEqual(testCompany.siret);
    expect("FR").toEqual(testCompany.codePaysEtrangerEtablissement);
    process.env = OLD_ENV;
  });

  it(`should allow searching Trackdechets secours company`, async () => {
    createInput.siret = "11111111192062";
    const { siret } = await prisma.anonymousCompany.create({
      data: {
        orgId: createInput.siret,
        ...createInput
      }
    });
    const testCompany = await searchCompany(siret);
    expect(siret).toEqual(testCompany.siret);
    expect("FR").toEqual(testCompany.codePaysEtrangerEtablissement);
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
    const siret = siretify(1);
    const company = {
      siret,
      name: "ACME",
      naf: "NAF",
      libelleNaf: "Autres activités",
      codeCommune: "13001",
      address: "40 boulevard Voltaire 13001 Marseille",
      addressVoie: "40 boulevard",
      addressCity: "Marseille",
      addressPostalCode: "13001",
      etatAdministratif: "A",
      codePaysEtrangerEtablissement: "FR"
    };
    searchCompanyMock.mockResolvedValue(company);
    const companies = await searchCompanies(siret);
    expect(searchCompanyMock).toHaveBeenCalledWith(siret);
    expect(companies[0]).toStrictEqual(company);
  });

  it("should call searchCompany when the clue is formatted like a SIRET but with bad characters", async () => {
    const siret = siretify(1);
    const company = {
      siret,
      name: "ACME",
      naf: "NAF",
      libelleNaf: "Autres activités",
      codeCommune: "13001",
      address: "40 boulevard Voltaire 13001 Marseille",
      addressVoie: "40 boulevard",
      addressCity: "Marseille",
      addressPostalCode: "13001",
      etatAdministratif: "A",
      codePaysEtrangerEtablissement: "FR"
    };
    searchCompanyMock.mockResolvedValue(company);
    const companies = await searchCompanies(siret.split("").join(" "));
    expect(searchCompanyMock).toHaveBeenCalledWith(siret);
    expect(companies[0]).toStrictEqual(company);
  });

  it("should call searchCompany when the clue is formatted like a VAT number", async () => {
    const company = {
      siret: siretify(1),
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
    expect(searchCompanyMock).toHaveBeenCalledTimes(1);
  });

  it("should call searchCompany when the clue is formatted like a VAT number but with bad characters", async () => {
    const company = {
      siret: siretify(1),
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
    await searchCompanies("IT09301420155".split("").join("."));
    expect(searchCompanyMock).toHaveBeenCalledTimes(1);
  });


  it(`should not return closed companies when searching by SIRET`, async () => {
    const siret = siretify(1);
    searchCompanyMock.mockResolvedValue({
      siret,
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
    const companies = await searchCompanies(siret);
    expect(searchCompanyMock).toHaveBeenCalledWith(siret);
    expect(companies).toStrictEqual([]);
  });

  it(`should return [] if SIRET does not exist when searching by SIRET`, async () => {
    const siret = siretify(1);
    searchCompanyMock.mockRejectedValue(new Error("Not found"));
    const companies = await searchCompanies(siret);
    expect(searchCompanyMock).toHaveBeenCalledWith(siret);
    expect(companies).toStrictEqual([]);
  });
});
