import { makeSearchCompanies, searchCompany } from "../search";
import { ErrorCode } from "../../common/errors";
import prisma from "../../prisma";
import client from "../sirene/trackdechets/esClient";
import { siretify } from "../../__tests__/factories";
import { SearchHit } from "../sirene/trackdechets/types";

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
    findUnique: jest.fn(() => Promise.resolve(null)),
    findMany: jest.fn(() => Promise.resolve([]))
  }
}));

jest.mock("../sirene/trackdechets/esClient");

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
    const testCompany = await searchCompany(siret!);
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
    const testCompany = await searchCompany(siret!);
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
    (client.search as jest.Mock).mockReset();
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

  it("should call searchCompany when the clue is formatted like a SIRET but without bad characters", async () => {
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

  it("should call searchCompany when the clue is formatted like a VAT number but without bad characters", async () => {
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

  it("should call searchCompanies by name when the clue is formatted like a text and overwrite data from Sirene", async () => {
    const siret = siretify(1);
    const company = {
      siret,
      orgId: siret,
      name: "ACME OF TRACKDECHETS",
      naf: "NAF",
      libelleNaf: "Autres activités",
      codeCommune: "13001",
      address: "40 boulevard Voltaire 13001 Marseille",
      addressVoie: "40 boulevard",
      addressCity: "Marseille",
      addressPostalCode: "13001",
      etatAdministratif: "A"
    };
    const companies = [company];
    (prisma.company.findMany as jest.Mock).mockResolvedValue(companies);

    // SIRENE return a different information
    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret: company.siret,
                denominationUniteLegale: company.name,
                numeroVoieEtablissement: "4",
                typeVoieEtablissement: "BD",
                libelleVoieEtablissement: "LONGCHAMP",
                codePostalEtablissement: "13001",
                libelleCommuneEtablissement: "MARSEILLE",
                activitePrincipaleEtablissement: "6201Z",
                etatAdministratifEtablissement: company.etatAdministratif
              }
            }
          ] as SearchHit[]
        }
      }
    });
    // check that searchCompanies return Sirene data instead of prisma.company data
    const companiesSearched = await searchCompanies("ACME OF TRACKDECHETS");
    expect(companiesSearched).toHaveLength(1);
    const expected = {
      siret: company.siret,
      orgId: company.siret,
      isRegistered: true,
      statutDiffusionEtablissement: undefined,
      address: "4 BD LONGCHAMP 13001 MARSEILLE",
      addressVoie: "4 BD LONGCHAMP",
      codeCommune: undefined,
      codePaysEtrangerEtablissement: undefined,
      companyTypes: [],
      addressPostalCode: company.addressPostalCode,
      addressCity: "MARSEILLE",
      name: company.name,
      etatAdministratif: company.etatAdministratif,
      libelleNaf: "Programmation informatique",
      naf: "6201Z"
    };
    expect(companiesSearched[0]).toEqual(expected);
    expect(client.search as jest.Mock).toHaveBeenCalledTimes(1);
    expect(client.search as jest.Mock).toHaveBeenCalledWith(
      {
        _source_excludes: "td_search_companies",
        body: {
          query: {
            bool: {
              must: [
                {
                  match: {
                    td_search_companies: {
                      query: "ACME OF TRACKDECHETS"
                    }
                  }
                }
              ]
            }
          }
        },
        index: "stocketablissement-production",
        size: 20
      },
      undefined
    );
    expect(searchCompanyMock).toHaveBeenCalledTimes(0);
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
