import axios from "axios";
import { URL } from "url";
import { UserInputError } from "apollo-server-express";
import {
  libelleFromCodeNaf,
  buildAddress,
  safeParseFloat,
  removeDiacritics
} from "./utils";

const SIRENE_API_BASE_URL = "https://entreprise.data.gouv.fr/api/sirene";

/**
 * Build a company object from a search response
 * @param data etablissement response object
 */
function searchResponseToCompany({
  etablissement
}: SearchResponse): CompanySearchResult {
  const address = etablissement.geo_adresse
    ? etablissement.geo_adresse
    : buildAddress(
        etablissement.numero_voie,
        etablissement.type_voie,
        etablissement.libelle_voie,
        etablissement.code_postal,
        etablissement.libelle_commune
      );

  const company = {
    siret: etablissement.siret,
    etatAdministratif: etablissement.etat_administratif,
    address,
    name: etablissement.unite_legale.denomination,
    naf: etablissement.unite_legale.activite_principale,
    libelleNaf: "",
    longitude: safeParseFloat(etablissement.longitude),
    latitude: safeParseFloat(etablissement.latitude)
  };

  if (company.naf) {
    company.libelleNaf = libelleFromCodeNaf(company.naf);
  }

  return company;
}

/**
 * Search a company by SIRET
 * @param siret
 */
export function searchCompany(siret: string): Promise<CompanySearchResult> {
  const searchUrl = `${SIRENE_API_BASE_URL}/v3/etablissements/${siret}`;
  return axios
    .get<SearchResponse>(searchUrl)
    .then(r => searchResponseToCompany(r.data))
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 404) {
          // 404 "no results found"
          throw new UserInputError("Aucun établissement trouvé avec ce SIRET", {
            invalidArgs: ["siret"]
          });
        }
      }
      throw error;
    });
}

/**
 * Build a list of company objects from a full text search response
 * @param data etablissement response object
 */
function fullTextSearchResponseToCompanies(
  r: FullTextSearchResponse
): CompanySearchResult[] {
  return r.etablissement.map(etablissement => {
    const address = etablissement.geo_adresse
      ? etablissement.geo_adresse
      : buildAddress(
          etablissement.numero_voie,
          etablissement.type_voie,
          etablissement.libelle_voie,
          etablissement.code_postal,
          etablissement.libelle_commune
        );

    return {
      siret: etablissement.siret,
      address,
      name: etablissement.nom_raison_sociale,
      naf: etablissement.activite_principale,
      libelleNaf: etablissement.libelle_activite_principale,
      longitude: safeParseFloat(etablissement.longitude),
      latitude: safeParseFloat(etablissement.latitude)
    };
  });
}

/**
 * Full text search in SIRENE database
 *
 * API v1 is still used here because v3 does not support
 * full text. It is marked as DEPRECATED but the team in
 * #entreprise-data-gouv will still support it until
 * v3 includes full text. The Solr index of the v1 is still
 * updated with new data
 *
 * @param clue search string
 * @param department department filter
 */
export function searchCompanies(
  clue: string,
  department?: string
): Promise<CompanySearchResult[]> {
  if (/[0-9]{14}/.test(clue)) {
    // clue is formatted like a SIRET
    // use search by siret instead of full text
    return searchCompany(clue)
      .then(c => [c])
      .catch(_ => []);
  }

  let params = {};

  if (department && department.length === 2) {
    params = { departement: department };
  }

  if (department && department.length === 5) {
    // this migth actually be a postal code
    params = { code_postal: department };
  }

  const formattedClue = removeDiacritics(clue);
  const searchUrl = new URL(
    formattedClue,
    `${SIRENE_API_BASE_URL}/v1/full_text/`
  );

  const opts = { ...(params ? { params } : {}) };
  return axios
    .get<FullTextSearchResponse>(searchUrl.toString(), opts)
    .then(r => {
      return fullTextSearchResponseToCompanies(r.data);
    })
    .catch(error => {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 404) {
          // 404 "no results found"
          return [];
        }
      }
      throw error;
    });
}
