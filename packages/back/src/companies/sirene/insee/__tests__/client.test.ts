import { searchCompany, searchCompanies } from "../client";
import { ErrorCode } from "../../../../common/errors";
import * as token from "../token";

const axiosGet = jest.spyOn(token, "authorizedAxiosGet");

const axiosResponseDefault = {
  statusText: "",
  config: null,
  headers: null
};

describe("searchCompany", () => {
  afterEach(() => {
    axiosGet.mockReset();
  });

  it("should retrieve a company by siret", async () => {
    axiosGet.mockResolvedValueOnce({
      ...axiosResponseDefault,
      status: 200,
      data: {
        etablissement: {
          siret: "85001946400013",
          uniteLegale: {
            denominationUniteLegale: "CODE EN STOCK",
            categorieJuridiqueUniteLegale: "",
            prenom1UniteLegale: "",
            nomUniteLegale: ""
          },
          adresseEtablissement: {
            numeroVoieEtablissement: "4",
            indiceRepetitionEtablissement: "bis",
            typeVoieEtablissement: "BD",
            complementAdresseEtablissement: "Bat G",
            libelleVoieEtablissement: "LONGCHAMP",
            codePostalEtablissement: "13001",
            libelleCommuneEtablissement: "Marseille",
            codeCommuneEtablissement: "13201"
          },
          periodesEtablissement: [
            {
              etatAdministratifEtablissement: "A",
              activitePrincipaleEtablissement: "62.01Z"
            }
          ]
        }
      }
    });

    const company = await searchCompany("85001946400013");
    const expected = {
      siret: "85001946400013",
      etatAdministratif: "A",
      address: "4 bis BD LONGCHAMP Bat G 13001 Marseille",
      addressVoie: "4 bis BD LONGCHAMP Bat G",
      addressPostalCode: "13001",
      addressCity: "Marseille",
      codeCommune: "13201",
      name: "CODE EN STOCK",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique"
    };
    expect(company).toEqual(expected);
  });

  it(`should set name for an individual enterprise
      by concatenating first and last name`, async () => {
    axiosGet.mockResolvedValueOnce({
      ...axiosResponseDefault,
      status: 200,
      data: {
        etablissement: {
          siret: "34393738900041",
          uniteLegale: {
            denominationUniteLegale: "",
            categorieJuridiqueUniteLegale: "1000",
            prenom1UniteLegale: "JOHN",
            nomUniteLegale: "SNOW"
          },
          adresseEtablissement: {
            numeroVoieEtablissement: "4",
            typeVoieEtablissement: "RUE",
            libelleVoieEtablissement: "DES ROSIERS",
            codePostalEtablissement: "13001",
            libelleCommuneEtablissement: "Marseille",
            codeCommuneEtablissement: "13201"
          },
          periodesEtablissement: [
            {
              etatAdministratifEtablissement: "A",
              activitePrincipaleEtablissement: "62.01Z"
            }
          ]
        }
      }
    });
    const company = await searchCompany("34393738900041");
    expect(company.name).toEqual("JOHN SNOW");
  });

  it("should raise BAD_USER_INPUT if error 404 (siret not found)", async () => {
    axiosGet.mockRejectedValueOnce({
      response: {
        status: 404
      }
    });
    expect.assertions(1);
    try {
      await searchCompany("xxxxxxxxxxxxxx");
    } catch (e) {
      expect(e.extensions.code).toEqual(ErrorCode.BAD_USER_INPUT);
    }
  });

  it(`should escalate other types of errors
          (network, internal server error, etc)`, async () => {
    axiosGet.mockRejectedValueOnce({
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
    axiosGet.mockReset();
  });

  it("perform a full text search based on a clue", async () => {
    axiosGet.mockResolvedValueOnce({
      ...axiosResponseDefault,
      status: 200,
      data: {
        etablissements: [
          {
            siret: "85001946400013",
            uniteLegale: {
              denominationUniteLegale: "CODE EN STOCK",
              categorieJuridiqueUniteLegale: "",
              prenom1UniteLegale: "",
              nomUniteLegale: ""
            },
            adresseEtablissement: {
              numeroVoieEtablissement: "4",
              typeVoieEtablissement: "BD",
              libelleVoieEtablissement: "LONGCHAMP",
              codePostalEtablissement: "13001",
              libelleCommuneEtablissement: "Marseille",
              codeCommuneEtablissement: "13201"
            },
            periodesEtablissement: [
              {
                etatAdministratifEtablissement: "A",
                activitePrincipaleEtablissement: "62.01Z"
              }
            ]
          }
        ]
      }
    });
    const companies = await searchCompanies("code en stock");
    expect(companies).toHaveLength(1);
    const expected = {
      siret: "85001946400013",
      address: "4 BD LONGCHAMP 13001 Marseille",
      addressVoie: "4 BD LONGCHAMP",
      addressPostalCode: "13001",
      addressCity: "Marseille",
      codeCommune: "13201",
      etatAdministratif: "A",
      name: "CODE EN STOCK",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique"
    };
    expect(companies[0]).toEqual(expected);
  });

  it("should return empty array if no results", async () => {
    axiosGet.mockRejectedValueOnce({
      response: {
        status: 404
      }
    });
    const companies = await searchCompanies("sdsdhuu876gbshdsdsd");
    expect(companies).toHaveLength(0);
  });

  it(`should escalate other types of errors
      (network, internal server error, etc)`, async () => {
    axiosGet.mockRejectedValueOnce({
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
    axiosGet.mockResolvedValueOnce({
      ...axiosResponseDefault,
      status: 200,
      data: {
        etablissements: [
          {
            siret: "xxxxxxxxxxxxxx",
            uniteLegale: {
              denominationUniteLegale: "BOULANGERIE",
              categorieJuridiqueUniteLegale: "",
              prenom1UniteLegale: "",
              nomUniteLegale: ""
            },
            adresseEtablissement: {
              numeroVoieEtablissement: "1",
              typeVoieEtablissement: "ROUTE",
              libelleVoieEtablissement: "DES BLÉS",
              codePostalEtablissement: "07100",
              libelleCommuneEtablissement: "ANNONAY",
              codeCommuneEtablissement: "07110"
            },
            periodesEtablissement: [
              {
                etatAdministratifEtablissement: "A",
                activitePrincipaleEtablissement: "4724Z"
              }
            ]
          }
        ]
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
      codeCommune: "07110",
      etatAdministratif: "A",
      name: "BOULANGERIE",
      naf: "4724Z",
      libelleNaf:
        "Commerce de détail de pain, pâtisserie et confiserie en magasin spécialisé"
    };
    expect(companies[0]).toEqual(expected);
    const callUrl = axiosGet.mock.calls[0][0];
    expect(callUrl).toContain("codePostalEtablissement:07*");
  });
});
