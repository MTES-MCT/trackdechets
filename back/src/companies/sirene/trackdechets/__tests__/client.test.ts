import { searchCompany, searchCompanies } from "../client";
import client from "../esClient";
import { SearchHit } from "../types";
import { siretify } from "../../../../__tests__/factories";
import { SiretNotFoundError } from "../../errors";

jest.mock("../esClient");

describe("searchCompany", () => {
  afterEach(() => {
    (client.search as jest.Mock).mockReset();
  });

  it("should retrieve a company by siret", async () => {
    const siret = siretify(6);

    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret,
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
                denominationUniteLegale: "CODE EN STOCK",
                codePaysEtrangerEtablissement: ""
              }
            }
          ]
        }
      }
    });
    const company = await searchCompany(siret);
    const expected = {
      siret,
      etatAdministratif: "A",
      statutDiffusionEtablissement: "O",
      address: "4 bis BD LONGCHAMP Bat G 13001 MARSEILLE",
      addressVoie: "4 bis BD LONGCHAMP Bat G",
      addressPostalCode: "13001",
      addressCity: "MARSEILLE",
      codeCommune: "13201",
      name: "CODE EN STOCK",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      codePaysEtrangerEtablissement: ""
    };
    expect(company).toEqual(expected);
  });

  it(`should set name for an individual enterprise
      by concatenating first and last name`, async () => {
    const siret = siretify(6);

    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret,
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
          ]
        }
      }
    });
    const company = await searchCompany("34393738900041");
    expect(company.name).toEqual("JOHN SNOW");
  });

  it.each([
    "denominationUsuelleEtablissement",
    "denominationUsuelle1UniteLegale",
    "denominationUsuelle2UniteLegale",
    "denominationUsuelle3UniteLegale",
    "enseigne1Etablissement",
    "enseigne2Etablissement",
    "enseigne3Etablissement",
    "sigleUniteLegale"
  ])("should add %p in parenthsis if present", async field => {
    const siret = siretify(6);

    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret,
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
                denominationUniteLegale: "CODE EN STOCK",
                codePaysEtrangerEtablissement: "",
                [field]: "CES"
              }
            }
          ]
        }
      }
    });
    const company = await searchCompany(siret);
    expect(company.name).toEqual("CODE EN STOCK (CES)");
  });

  it("should set only one secondary name in parenthesis", async () => {
    const siret = siretify(6);

    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret,
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
                denominationUniteLegale: "CODE EN STOCK",
                codePaysEtrangerEtablissement: "",
                denominationUsuelleEtablissement: "The awesome company",
                enseigne1Etablissement: "CES"
              }
            }
          ]
        }
      }
    });
    const company = await searchCompany(siret);
    expect(company.name).toEqual("CODE EN STOCK (The awesome company)");
  });

  it("should not set secondary name in parenthesis if it is equal to company name", async () => {
    const siret = siretify(6);

    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret,
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
                denominationUniteLegale: "CODE EN STOCK",
                codePaysEtrangerEtablissement: "",
                denominationUsuelleEtablissement: "CODE EN STOCK"
              }
            }
          ]
        }
      }
    });
    const company = await searchCompany(siret);
    expect(company.name).toEqual("CODE EN STOCK");
  });

  it("should raise SiretNotFound if error 404 (siret not found)", async () => {
    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: []
        }
      }
    });
    expect(searchCompany("xxxxxxxxxxxxxx")).rejects.toThrow(SiretNotFoundError);
  });

  it(`should re-throw other types of errors
          (network, internal server error, etc)`, async () => {
    const siret = siretify(6);

    (client.search as jest.Mock).mockRejectedValueOnce({
      message: "Erreur inconnue"
    });
    expect.assertions(1);
    try {
      await searchCompany(siret);
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
    const siret = siretify(6);

    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret,
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
      siret,
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
    const siret = siretify(6);

    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret,
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
      siret,
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
    const siret = siretify(6);

    (client.search as jest.Mock).mockResolvedValueOnce({
      body: {
        hits: {
          hits: [
            {
              _source: {
                siret,
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
    const companies = await searchCompanies(siret);
    expect(companies).toHaveLength(1);
  });
});
