import { resetDatabase } from "../../../integration-tests/helper";
import { companyFactory, siretify } from "../../__tests__/factories";
import { makeSearchCompanies, searchCompany } from "../search";
import { SireneSearchResult } from "../sirene/types";
import { CompanySearchResult } from "@td/codegen-back";

const mockSearchCompanyBackend = jest.fn();
jest.mock("../sirene/searchCompany", () => ({
  __esModule: true,
  default: (...args) => mockSearchCompanyBackend(...args)
}));

describe("searchCompanies(clue, department, allowForeignCompanies) }", () => {
  const searchCompaniesMockFn = jest.fn();
  const searchCompanies = makeSearchCompanies({
    injectedSearchCompany: searchCompany,
    injectedSearchCompanies: searchCompaniesMockFn
  });

  beforeEach(() => {
    searchCompaniesMockFn.mockReset();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  it("should search by string clue, merging info from SIRENE and Trackdechets DB, including isRegistered and trackdechetsId", async () => {
    const company = await companyFactory();
    searchCompaniesMockFn.mockResolvedValueOnce([
      {
        siret: company.siret,
        name: company.name,
        address: "4 BD LONGCHAMP 13001 MARSEILLE",
        addressCity: "MARSEILLE",
        addressPostalCode: "13000",
        addressVoie: "4 BD LONGCHAMP",
        codeCommune: undefined,
        libelleNaf: "Programmation informatique",
        naf: "6201Z",
        etatAdministratif: "A",
        statutDiffusionEtablissement: "O",
        codePaysEtrangerEtablissement: undefined
      }
    ] as SireneSearchResult[]);

    const companies = await searchCompanies("Code en Stock");
    expect(companies).toHaveLength(1);
    expect(companies[0].isRegistered).toBeTruthy();
    expect(companies[0].trackdechetsId).toBe(company.id);
  });

  it("should search by SIRET, merging SIRENE and Trackdechets DB infos, including isRegistered and trackdechetsId", async () => {
    const company = await companyFactory();
    mockSearchCompanyBackend.mockResolvedValueOnce({
      orgId: company.siret,
      siret: company.siret,
      denominationUniteLegale: company.name,
      name: company.name,
      numeroVoieEtablissement: "4",
      typeVoieEtablissement: "BD",
      libelleVoieEtablissement: "LONGCHAMP",
      codePostalEtablissement: "13001",
      libelleCommuneEtablissement: "MARSEILLE",
      activitePrincipaleEtablissement: "6201Z",
      address: "4 BD LONGCHAMP 13001 MARSEILLE",
      addressCity: "MARSEILLE",
      addressPostalCode: "13000",
      addressVoie: "4 BD LONGCHAMP",
      codeCommune: undefined,
      libelleNaf: "Programmation informatique",
      naf: "6201Z",
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O",
      codePaysEtrangerEtablissement: undefined,
      isDormant: false
    } as CompanySearchResult);

    const companies = await searchCompanies(company.orgId!);
    expect(companies).toHaveLength(1);
    expect(companies[0].isRegistered).toBeTruthy();
    expect(companies[0].trackdechetsId).toBe(company.id);
  });

  it("should search by SIRET, event without Trackdechets DB infos, including isRegistered and trackdechetsId", async () => {
    const siret = siretify();
    mockSearchCompanyBackend.mockResolvedValueOnce({
      orgId: siret,
      siret: siret,
      denominationUniteLegale: "company.name",
      name: "company.name",
      numeroVoieEtablissement: "4",
      typeVoieEtablissement: "BD",
      libelleVoieEtablissement: "LONGCHAMP",
      codePostalEtablissement: "13001",
      libelleCommuneEtablissement: "MARSEILLE",
      activitePrincipaleEtablissement: "6201Z",
      address: "4 BD LONGCHAMP 13001 MARSEILLE",
      addressCity: "MARSEILLE",
      addressPostalCode: "13000",
      addressVoie: "4 BD LONGCHAMP",
      codeCommune: undefined,
      libelleNaf: "Programmation informatique",
      naf: "6201Z",
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O",
      codePaysEtrangerEtablissement: undefined,
      isDormant: false
    } as CompanySearchResult);

    const companies = await searchCompanies(siret);
    expect(companies).toHaveLength(1);
    expect(companies[0].isRegistered).toBeFalsy();
    expect(companies[0].trackdechetsId).toBeUndefined();
  });
});
