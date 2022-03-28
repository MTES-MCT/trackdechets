import axios, { AxiosError } from "axios";
import { UserInputError } from "apollo-server-express";
import { removeDiacritics } from "../utils";
import {
  SireneSearchResult,
  SearchResponseSocialGouv,
  FullTextSearchResponseSocialGouv,
  MatchingEtablissementSocialGouv
} from "../types";

const SOCIAL_GOUV_API_BASE_URL =
  "https://search-recherche-entreprises.fabrique.social.gouv.fr";

/**
 * Build a company object from a search response
 */
function searchResponseToCompany(
  response: SearchResponseSocialGouv
): SireneSearchResult {
  const company = {
    siret: response.siret,
    etatAdministratif: response.etatAdministratifEtablissement,
    address: response.address,
    addressVoie: "",
    addressPostalCode: "",
    addressCity: "",
    codeCommune: response.codeCommuneEtablissement,
    name: response.label,
    naf: "",
    libelleNaf: response.activitePrincipale
  };

  return company;
}

/**
 * Search a company by SIRET
 */
export function searchCompany(siret: string): Promise<SireneSearchResult> {
  const searchUrl = `${SOCIAL_GOUV_API_BASE_URL}/api/v1/etablissement/${siret}`;

  return axios
    .get<SearchResponseSocialGouv>(searchUrl)
    .then(r => searchResponseToCompany(r.data))
    .catch((error: AxiosError) => {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response?.status === 404) {
        // 404 "no results found"
        throw new UserInputError("Aucun établissement trouvé avec ce SIRET", {
          invalidArgs: ["siret"]
        });
      }
      throw error;
    });
}

/**
 * Build a list of company objects from a full text search responset
 */
function fullTextSearchResponseToCompanies(
  r: FullTextSearchResponseSocialGouv
): SireneSearchResult[] {
  const matchingEtablissements: (MatchingEtablissementSocialGouv & {
    name: string;
  })[] = [];

  for (const entreprise of r.entreprises) {
    for (const etablissement of entreprise.allMatchingEtablissements) {
      matchingEtablissements.push({ ...etablissement, name: entreprise.label });
    }
  }

  const etablissements = matchingEtablissements.map(etablissement => {
    return {
      siret: etablissement.siret,
      address: etablissement.address,
      addressVoie: "",
      addressPostalCode: "",
      addressCity: "",
      name: etablissement.name,
      naf: "",
      libelleNaf: "",
      etatAdministratif: "A"
    };
  });

  return etablissements.slice(0, 10);
}

export function searchCompanies(
  clue: string,
  department?: string
): Promise<SireneSearchResult[]> {
  if (/[0-9]{14}/.test(clue)) {
    // clue is formatted like a SIRET
    // use search by siret instead of full text
    return searchCompany(clue).then(c => [c]);
  }

  const formattedClue = removeDiacritics(clue);
  const params = {
    limit: 5,
    query: formattedClue,
    ...(department && department.length > 0 ? { address: department } : {})
  };

  return axios
    .get<FullTextSearchResponseSocialGouv>(
      `${SOCIAL_GOUV_API_BASE_URL}/api/v1/search/`,
      { params }
    )
    .then(r => {
      return fullTextSearchResponseToCompanies(r.data);
    })
    .catch(error => {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response?.status === 404) {
        // 404 "no results found"
        return [];
      }
      throw error;
    });
}
