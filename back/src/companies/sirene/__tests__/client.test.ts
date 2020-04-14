import { searchCompany, searchCompanies } from "../client";
import { ErrorCode } from "../../../common/errors";
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
          type_voie: "BD",
          libelle_voie: "LONGCHAMP",
          code_postal: "13001",
          code_commune: "13201",
          libelle_commune: "MARSEILLE",
          longitude: "5.387141",
          latitude: "43.300746",
          geo_adresse: "4 Boulevard Longchamp 13001 Marseille",
          unite_legale: {
            denomination: "CODE EN STOCK",
            activite_principale: "62.01Z"
          }
        }
      }
    });
    const company = await searchCompany("85001946400013");
    const expected = {
      siret: "85001946400013",
      etatAdministratif: "A",
      address: "4 Boulevard Longchamp 13001 Marseille",
      codeCommune: "13201",
      name: "CODE EN STOCK",
      naf: "62.01Z",
      libelleNaf: "Programmation informatique",
      longitude: 5.387141,
      latitude: 43.300746
    };
    expect(company).toEqual(expected);
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
            longitude: "5.387141",
            latitude: "43.300746",
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
      name: "CODE EN STOCK",
      naf: "6201Z",
      libelleNaf: "Programmation informatique",
      longitude: 5.387141,
      latitude: 43.300746
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
            longitude: "5.38641",
            latitude: "43.300208",
            geo_adresse: "18 Cours Joseph Thierry 13001 Marseille"
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
            longitude: "4.693487",
            latitude: "45.258127",
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
      name: "BOULANGERIE",
      naf: "4724Z",
      libelleNaf:
        "Commerce de détail de pain, pâtisserie et confiserie en magasin spécialisé",
      longitude: 4.693487,
      latitude: 45.258127
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
          longitude: "5.387141",
          latitude: "43.300746",
          geo_adresse: "4 Boulevard Longchamp 13001 Marseille",
          unite_legale: {
            denomination: "CODE EN STOCK",
            activite_principale: "62.01Z"
          }
        }
      }
    });
    const companies = await searchCompanies("85001946400013");
    expect(companies).toHaveLength(1);
  });
});
