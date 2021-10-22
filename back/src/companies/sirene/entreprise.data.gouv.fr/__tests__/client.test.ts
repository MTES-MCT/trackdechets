import { searchCompany, searchCompanies } from "../client";
import { ErrorCode } from "../../../../common/errors";
import axios from "axios";

jest.mock("axios");

describe("searchCompany", () => {
  afterEach(() => {
    (axios.get as jest.Mock).mockReset();
  });

  it("should retrieve a company by siret", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        etablissement: {
          siret: "85001946400013",
          etat_administratif: "A",
          numero_voie: "4",
          indice_repetition: "bis",
          type_voie: "BD",
          libelle_voie: "LONGCHAMP",
          complement_adresse: "Bat G",
          code_postal: "13001",
          code_commune: "13201",
          libelle_commune: "MARSEILLE",
          activite_principale: "62.01Z",
          unite_legale: {
            denomination: "CODE EN STOCK"
          }
        }
      }
    });
    const company = await searchCompany("85001946400013");
    const expected = {
      siret: "85001946400013",
      etatAdministratif: "A",
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

  it(`should set name for an individual enterprise
      by concatenating first and last name`, async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        etablissement: {
          siret: "34393738900041",
          etat_administratif: "A",
          numero_voie: "4",
          type_voie: "RUE",
          libelle_voie: "DES ROSIERS",
          code_postal: "13001",
          code_commune: "13201",
          libelle_commune: "MARSEILLE",
          geo_adresse: "4 RUE DES ROSIERS 13001 Marseille",
          activite_principale: "86.21Z",
          unite_legale: {
            denomination: null,
            prenom_1: "JOHN",
            nom: "SNOW",
            categorie_juridique: "1000"
          }
        }
      }
    });
    const company = await searchCompany("34393738900041");
    expect(company.name).toEqual("JOHN SNOW");
  });

  it("should raise BAD_USER_INPUT if error 404 (siret not found)", async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce({
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
    (axios.get as jest.Mock).mockRejectedValueOnce({
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
    (axios.get as jest.Mock).mockReset();
  });

  it("perform a full text search based on a clue", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        etablissement: [
          {
            siret: "85001946400013",
            nom_raison_sociale: "CODE EN STOCK",
            numero_voie: "4",
            type_voie: "BD",
            libelle_voie: "LONGCHAMP",
            code_postal: "13001",
            libelle_commune: "MARSEILLE",
            activite_principale: "6201Z",
            libelle_activite_principale: "Programmation informatique",
            geo_adresse: "4 Boulevard Longchamp 13001 Marseille"
          }
        ]
      }
    });
    const companies = await searchCompanies("code en stock");
    expect(companies).toHaveLength(1);
    const expected = {
      siret: "85001946400013",
      address: "4 Boulevard Longchamp 13001 Marseille",
      addressVoie: "4 BD LONGCHAMP",
      addressPostalCode: "13001",
      addressCity: "MARSEILLE",
      name: "CODE EN STOCK",
      naf: "6201Z",
      libelleNaf: "Programmation informatique",
      etatAdministratif: "A"
    };
    expect(companies[0]).toEqual(expected);
  });

  it("should remove diacritics (accents) from clue", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        etablissement: [
          {
            siret: "79824982700014",
            nom_raison_sociale: "LE BAR A PAIN",
            numero_voie: "18",
            type_voie: "COURS",
            libelle_voie: "JOSEPH THIERRY",
            code_postal: "13001",
            libelle_commune: "MARSEILLE",
            activite_principale: "1071C",
            libelle_activite_principale:
              "Boulangerie et boulangerie-pâtisserie",
            geo_adresse: "18 Cours Joseph Thierry 13001 Marseille",
            etatAdministratif: "A"
          }
        ]
      }
    });
    await searchCompanies("le bar à pain");
    expect(
      axios.get as jest.Mock
    ).toHaveBeenCalledWith(
      "https://entreprise.data.gouv.fr/api/sirene/v1/full_text/le%20bar%20a%20pain",
      { params: {} }
    );
  });

  it("should return empty array if no results", async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce({
      response: {
        status: 404
      }
    });
    const companies = await searchCompanies("sdsdhuu876gbshdsdsd");
    expect(companies).toHaveLength(0);
  });

  it(`should escalate other types of errors
      (network, internal server error, etc)`, async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce({
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
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        etablissement: [
          {
            siret: "xxxxxxxxxxxxxx",
            nom_raison_sociale: "BOULANGERIE",
            numero_voie: "1",
            type_voie: "ROUTE",
            libelle_voie: "DES BLÉS",
            code_postal: "07100",
            libelle_commune: "ANNONAY",
            activite_principale: "4724Z",
            libelle_activite_principale:
              "Commerce de détail de pain, pâtisserie et confiserie en magasin spécialisé",
            geo_adresse: "1 route des blés 07100 ANNONAY"
          }
        ]
      }
    });

    const companies = await searchCompanies("boulangerie", "07");
    expect(companies).toHaveLength(1);
    const expected = {
      siret: "xxxxxxxxxxxxxx",
      address: "1 route des blés 07100 ANNONAY",
      addressVoie: "1 ROUTE DES BLÉS",
      addressPostalCode: "07100",
      addressCity: "ANNONAY",
      name: "BOULANGERIE",
      naf: "4724Z",
      libelleNaf:
        "Commerce de détail de pain, pâtisserie et confiserie en magasin spécialisé",
      etatAdministratif: "A"
    };
    expect(companies[0]).toEqual(expected);
    expect(
      axios.get
    ).toHaveBeenCalledWith(
      "https://entreprise.data.gouv.fr/api/sirene/v1/full_text/boulangerie",
      { params: { departement: "07" } }
    );
  });

  it("should search by siret if clue is formatted like a siret", async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        etablissement: {
          siret: "85001946400013",
          numero_voie: "4",
          type_voie: "BD",
          libelle_voie: "LONGCHAMP",
          code_postal: "13001",
          libelle_commune: "MARSEILLE",
          geo_adresse: "4 Boulevard Longchamp 13001 Marseille",
          activite_principale: "62.01Z",
          unite_legale: {
            denomination: "CODE EN STOCK"
          }
        }
      }
    });
    const companies = await searchCompanies("85001946400013");
    expect(companies).toHaveLength(1);
  });
});
