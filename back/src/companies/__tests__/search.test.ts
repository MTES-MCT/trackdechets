import { makeSearchCompanies, searchCompany } from "../search";
import { ErrorCode } from "../../common/errors";
import { prisma } from "@td/prisma";
import { siretify } from "../../__tests__/factories";
import { SireneSearchResult } from "../sirene/types";
import decoratedSearchCompanies from "../sirene/searchCompanies";
import { ViesClientError } from "../vat/vies/client";

const testSiret = siretify(3);
const createInput = {
  siret: testSiret,
  orgId: testSiret,
  name: "Établissement de test",
  address: "Adresse test",
  codeNaf: "XXXXX",
  libelleNaf: "Entreprise de test",
  codeCommune: "00000"
};

const mockCreateAnonymous = jest.fn();
const mockFindAnonymous = jest.fn();

jest.mock("@td/prisma", () => ({
  ...jest.requireActual("@td/prisma"),
  prisma: {
    anonymousCompany: {
      create: jest.fn((...args) => mockCreateAnonymous(...args)),
      findUnique: jest.fn((...args) => mockFindAnonymous(...args))
    },
    company: {
      findUnique: jest.fn(() => Promise.resolve(null)),
      findMany: jest.fn(() => Promise.resolve([]))
    }
  }
}));

const mockSearchCompaniesBackend = jest.fn();
jest.mock("../sirene/searchCompanies", () => ({
  __esModule: true,
  default: (...args) => mockSearchCompaniesBackend(...args)
}));

describe("searchCompany by org identifier", () => {
  beforeEach(() => {
    mockCreateAnonymous.mockImplementation(() => Promise.resolve(createInput));
    mockFindAnonymous.mockImplementation(() => Promise.resolve(createInput));
  });

  afterEach(() => {
    mockCreateAnonymous.mockReset();
    mockFindAnonymous.mockReset();
  });

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

  it(`should not allow test company when env var ALLOW_TEST_COMPANY is false`, async () => {
    const OLD_ENV = process.env;
    process.env.ALLOW_TEST_COMPANY = "false";
    // re-load variables with custom env
    jest.resetModules();
    const searchCompany = require("../search").searchCompany;
    expect.assertions(1);
    try {
      await searchCompany("00000012354659");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
    process.env = OLD_ENV;
  });

  it(`should allow searching test company when env var ALLOW_TEST_COMPANY is true`, async () => {
    const OLD_ENV = process.env;
    process.env.ALLOW_TEST_COMPANY = "true";
    // re-load variables with custom env
    jest.resetModules();

    const { siret } = await prisma.anonymousCompany.create({
      data: {
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
        ...createInput
      }
    });
    const testCompany = await searchCompany(siret!);
    expect(siret).toEqual(testCompany.siret);
    expect("FR").toEqual(testCompany.codePaysEtrangerEtablissement);
  });

  it(`should allow searching foreign anonymous company`, async () => {
    const createInputForeign = {
      siret: "",
      orgId: "IT00818740151",
      name: "Établissement de test",
      address: "Adresse test",
      codeNaf: "XXXXX",
      libelleNaf: "Entreprise de test",
      codeCommune: "00000",
      vatNumber: "IT00818740151"
    };
    mockCreateAnonymous.mockImplementation(() =>
      Promise.resolve(createInputForeign)
    );
    mockFindAnonymous.mockImplementation(() =>
      Promise.resolve(createInputForeign)
    );
    await prisma.anonymousCompany.create({
      data: {
        ...createInputForeign
      }
    });
    const testCompany = await searchCompany(createInputForeign.vatNumber!);
    expect(createInputForeign.vatNumber).toEqual(testCompany.orgId);
    expect("IT").toEqual(testCompany.codePaysEtrangerEtablissement);
  });
});

describe("searchCompanies", () => {
  const searchCompanyMock = jest.fn();
  const searchCompanies = makeSearchCompanies({
    injectedSearchCompany: searchCompanyMock,
    injectedSearchCompanies: decoratedSearchCompanies
  });

  beforeEach(() => {
    searchCompanyMock.mockReset();
    mockSearchCompaniesBackend.mockReset();
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

  it("should call searchCompany when the clue is formatted like a SIRET but with spaces", async () => {
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

  it("should call searchCompany when the clue is formatted like a SIRET with bad characters", async () => {
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
    const companies = await searchCompanies(siret.split("").join("*"));
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
    await searchCompanies("IT09301420155", null, true);
    expect(searchCompanyMock).toHaveBeenCalledTimes(1);
  });

  it("should call searchCompany when the clue is formatted like a VAT number with bad characters", async () => {
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
    await searchCompanies("IT09301420155".split("").join("*"), null, true);
    expect(searchCompanyMock).toHaveBeenCalledTimes(1);
  });

  it("should call searchCompanies by name when the clue is formatted like a text and overwrite db data with Sirene data", async () => {
    const siret = siretify(1);
    const company = {
      id: "test",
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
    mockSearchCompaniesBackend.mockResolvedValueOnce([
      {
        siret: company.siret,
        address: "4 BD LONGCHAMP 13001 MARSEILLE",
        addressCity: "MARSEILLE",
        addressPostalCode: company.addressPostalCode,
        addressVoie: "4 BD LONGCHAMP",
        codeCommune: undefined,
        name: company.name,
        libelleNaf: "Programmation informatique",
        naf: "6201Z",
        etatAdministratif: company.etatAdministratif,
        statutDiffusionEtablissement: "O",
        codePaysEtrangerEtablissement: undefined
      }
    ] as SireneSearchResult[]);
    // check that searchCompanies return Sirene data instead of prisma.company data
    const companiesSearched = await searchCompanies("ACME OF TRACKDECHETS");
    expect(companiesSearched).toHaveLength(1);
    const expected = {
      trackdechetsId: company.id,
      vatNumber: undefined,
      siret: company.siret,
      orgId: company.siret,
      statutDiffusionEtablissement: "O",
      address: "4 BD LONGCHAMP 13001 MARSEILLE",
      addressCity: "MARSEILLE",
      addressPostalCode: company.addressPostalCode,
      addressVoie: "4 BD LONGCHAMP",
      codeCommune: undefined,
      codePaysEtrangerEtablissement: undefined,
      name: company.name,
      libelleNaf: "Programmation informatique",
      naf: "6201Z",
      allowBsdasriTakeOverWithoutSignature: undefined,
      companyTypes: [],
      contact: undefined,
      contactEmail: undefined,
      contactPhone: undefined,
      ecoOrganismeAgreements: [],
      etatAdministratif: "A",
      isDormant: false,
      isRegistered: true,
      collectorTypes: [],
      wasteProcessorTypes: [],
      wasteVehiclesTypes: [],
      ecoOrganismePartnersIds: [],
      website: undefined
    };
    expect(companiesSearched[0]).toEqual(expected);
    expect(mockSearchCompaniesBackend).toHaveBeenCalledTimes(1);
    expect(mockSearchCompaniesBackend).toHaveBeenCalledWith(
      "ACME OF TRACKDECHETS",
      undefined,
      true
    );
    expect(searchCompanyMock).toHaveBeenCalledTimes(0);
  });

  it(`should return [] if SIRET does not exist when searching by SIRET`, async () => {
    const siret = siretify(1);
    searchCompanyMock.mockRejectedValue(new Error("Not found"));
    const companies = await searchCompanies(siret);
    expect(searchCompanyMock).toHaveBeenCalledWith(siret);
    expect(companies).toStrictEqual([]);
  });

  it(`should return [] if VAT number is passed without allowForeignCompanies`, async () => {
    const vatNumber = "ESB50629187";
    const expected = {
      orgId: vatNumber,
      vatNumber,
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
    searchCompanyMock.mockResolvedValueOnce(expected);
    const companies = await searchCompanies(vatNumber, null, false);
    expect(searchCompanyMock).toHaveBeenCalledTimes(0);
    expect(companies).toStrictEqual([]);
  });

  it(`should return a foreign company if VAT number is passed with allowForeignCompanies`, async () => {
    const vatNumber = "ESB50629187";
    const expected = {
      orgId: vatNumber,
      vatNumber,
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
    searchCompanyMock.mockResolvedValueOnce(expected);
    const companies = await searchCompanies(vatNumber, null, true);
    expect(searchCompanyMock).toHaveBeenCalledWith(vatNumber);
    expect(companies).toStrictEqual([expected]);
  });

  it(`should return an empty [] if VAT VIES raises a random exception`, async () => {
    const vatNumber = "ESB50629187";
    searchCompanyMock.mockRejectedValueOnce(new Error("test"));
    const companies = await searchCompanies(vatNumber, null, true);
    expect(companies).toStrictEqual([]);
  });

  it(`should return a ViesClientError error if VAT VIES raises a ViesClientError exception`, async () => {
    const vatNumber = "ESB50629187";
    searchCompanyMock.mockRejectedValueOnce(new ViesClientError("test"));
    expect.assertions(1);
    try {
      await searchCompanies(vatNumber, null, true);
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.EXTERNAL_SERVICE_ERROR);
    }
  });
});
