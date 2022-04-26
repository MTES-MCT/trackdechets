import {
  searchCompany,
  searchCompanies,
  CompanyNotFoundInTrackdechetsSearch
} from "../client";
import { ErrorCode } from "../../../../common/errors";
import client from "../esClient";
import { ResponseError } from "@elastic/elasticsearch/lib/errors";
import { ApiResponse } from "@elastic/elasticsearch/lib/Transport";
import { SearchHit } from "../types";

jest.mock("../esClient");

describe("searchCompany", () => {
  afterEach(() => {
    (client.get as jest.Mock).mockReset();
  });

  it("should retrieve a company by siret", async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({
      body: {
        _source: {
          siret: "85001946400013",
          statutDiffusionEtablissement: "O",
          etatAdministratifEtablissement: "A",
          numeroVoieEtablissement: "4",
          indiceRepetitionEtablissement: "bis",
          typeVoieEtablissement: "BD",
          libelleVoieEtablissement: "LONGCHAMP",
          complementAdresseEtablissement: "Bat G",
          codePostalEtablissement: "13001",
          codeCommuneEtablissement: "13201",
          libelleCommuneEtablissement: "MARSEILLE",
          activitePrincipaleEtablissement: "62.01Z",
          denominationUniteLegale: "CODE EN STOCK"
        }
      }
    });
    const company = await searchCompany("85001946400013");
    const expected = {
      siret: "85001946400013",
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O",
      address: "4 bis BD LONGCHAMP Bat G 13001 MARSEILLE",
      addressVoie: "4 bis BD LONGCHAMP Bat G",
      addressPostalCode: "13001",
      addressCity: "MARSEILLE",
      codeCommune: "13201",
      name: "CODE EN STOCK",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique"
    };
    expect(company).toEqual(expected);
  });

  // FIXME this case may not even exist in INSEE public data
  it("should raise AnonymousCompanyError if non diffusible", async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({
      body: {
        _source: {
          siret: "85001946400013",
          statutDiffusionEtablissement: "N"
        }
      }
    });
    expect.assertions(1);
    try {
      await searchCompany("85001946400013");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.FORBIDDEN);
    }
  });

  it(`should set name for an individual enterprise
      by concatenating first and last name`, async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({
      body: {
        _source: {
          siret: "34393738900041",
          etatAdministratifEtablissement: "A",
          numeroVoieEtablissement: "4",
          typeVoieEtablissement: "RUE",
          libelleVoieEtablissement: "DES ROSIERS",
          codePostalEtablissement: "13001",
          codeCommuneEtablissement: "13201",
          libelleCommuneEtablissement: "MARSEILLE",
          activitePrincipaleEtablissement: "86.21Z",
          denominationUniteLegale: null,
          prenom1UniteLegale: "JOHN",
          nomUniteLegale: "SNOW",
          categorieJuridiqueUniteLegale: "1000"
        }
      }
    });
    const company = await searchCompany("34393738900041");
    expect(company.name).toEqual("JOHN SNOW");
  });

  it("should raise CompanyNotFound if error 404 (siret not found)", async () => {
    (client.get as jest.Mock).mockRejectedValueOnce(
      new ResponseError({
        statusCode: 404
      } as unknown as ApiResponse)
    );
    expect(searchCompany("xxxxxxxxxxxxxx")).rejects.toThrow(
      CompanyNotFoundInTrackdechetsSearch
    );
  });

  it(`should escalate other types of errors
          (network, internal server error, etc)`, async () => {
    (client.get as jest.Mock).mockRejectedValueOnce({
      message: "Erreur inconnue"
    });
    expect.assertions(1);
    try {
      await searchCompany("85001946400013");
    } catch (e) {
      expect(e.message).toEqual("Erreur inconnue");
    }
  });
});

describe("searchCompanies", () => {
  afterEach(() => {
    (client.search as jest.Mock).mockReset();
  });

  it("perform a full text search based on a clue", async () => {
    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret: "85001946400013",
                denominationUniteLegale: "CODE EN STOCK",
                numeroVoieEtablissement: "4",
                typeVoieEtablissement: "BD",
                libelleVoieEtablissement: "LONGCHAMP",
                codePostalEtablissement: "13001",
                libelleCommuneEtablissement: "MARSEILLE",
                activitePrincipaleEtablissement: "6201Z",
                etatAdministratifEtablissement: "A"
              }
            }
          ] as SearchHit[]
        }
      }
    });
    const companies = await searchCompanies("code en stock");
    expect(companies).toHaveLength(1);
    const expected = {
      siret: "85001946400013",
      address: "4 BD LONGCHAMP 13001 MARSEILLE",
      addressVoie: "4 BD LONGCHAMP",
      addressPostalCode: "13001",
      addressCity: "MARSEILLE",
      name: "CODE EN STOCK",
      naf: "6201Z",
      libelleNaf: "Programmation informatique",
      etatAdministratif: "A",
      codeCommuneEtablissement: undefined
    };
    expect(companies[0]).toEqual(expected);
  });

  it("should remove diacritics (accents) from clue", async () => {
    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret: "85001946400013",
                denominationUniteLegale: "LE BAR A PAIN",
                numeroVoieEtablissement: "40",
                typeVoieEtablissement: "COURS",
                libelleVoieEtablissement: "LONGCHAMP",
                codePostalEtablissement: "13001",
                libelleCommuneEtablissement: "MARSEILLE",
                activitePrincipaleEtablissement: "1071C",
                etatAdministratifEtablissement: "A"
              }
            }
          ] as SearchHit[]
        }
      }
    });
    const companies = await searchCompanies("le bar à pain");
    expect(companies).toHaveLength(1);
    const expected = {
      siret: "85001946400013",
      address: "40 COURS LONGCHAMP 13001 MARSEILLE",
      addressVoie: "40 COURS LONGCHAMP",
      addressPostalCode: "13001",
      addressCity: "MARSEILLE",
      name: "LE BAR A PAIN",
      naf: "1071C",
      etatAdministratif: "A",
      libelleNaf: "Boulangerie et boulangerie-pâtisserie",
      codeCommuneEtablissement: undefined
    };
    expect(companies[0]).toEqual(expected);
  });

  it("should return empty array if no results", async () => {
    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: []
        }
      }
    });
    const companies = await searchCompanies("sdsdhuu876gbshdsdsd");
    expect(companies).toHaveLength(0);
  });

  it(`should escalate other types of errors
      (network, internal server error, etc)`, async () => {
    (client.search as jest.Mock).mockRejectedValueOnce({
      message: "Erreur inconnue"
    });
    expect.assertions(1);
    try {
      await searchCompanies("boulangerie");
    } catch (e) {
      expect(e.message).toEqual("Erreur inconnue");
    }
  });

  it("should filter results by departement", async () => {
    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret: "xxxxxxxxxxxxxx",
                denominationUniteLegale: "BOULANGERIE",
                numeroVoieEtablissement: "1",
                typeVoieEtablissement: "ROUTE",
                libelleVoieEtablissement: "DES BLÉS",
                codePostalEtablissement: "07100",
                libelleCommuneEtablissement: "ANNONAY",
                activitePrincipaleEtablissement: "4724Z",
                etatAdministratifEtablissement: "A"
              }
            }
          ] as SearchHit[]
        }
      }
    });

    const companies = await searchCompanies("boulangerie", "07");
    expect(companies).toHaveLength(1);
    const expected = {
      siret: "xxxxxxxxxxxxxx",
      address: "1 ROUTE DES BLÉS 07100 ANNONAY",
      addressVoie: "1 ROUTE DES BLÉS",
      addressPostalCode: "07100",
      addressCity: "ANNONAY",
      name: "BOULANGERIE",
      naf: "4724Z",
      libelleNaf:
        "Commerce de détail de pain, pâtisserie et confiserie en magasin spécialisé",
      etatAdministratif: "A",
      codeCommune: undefined
    };
    expect(companies[0]).toEqual(expected);
  });

  it("should search by siret if clue is formatted like a siret", async () => {
    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret: "85001946400013",
                denominationUniteLegale: "CODE EN STOCK",
                numeroVoieEtablissement: "4",
                typeVoieEtablissement: "BD",
                libelleVoieEtablissement: "LONGCHAMP",
                codePostalEtablissement: "13001",
                libelleCommuneEtablissement: "MARSEILLE",
                activitePrincipaleEtablissement: "6201Z",
                etatAdministratifEtablissement: "A"
              }
            }
          ] as SearchHit[]
        }
      }
    });
    const companies = await searchCompanies("85001946400013");
    expect(companies).toHaveLength(1);
  });
});
