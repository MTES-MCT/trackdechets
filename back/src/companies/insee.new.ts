import axios from "axios";
import { cachedGet } from "../common/redis";
import { UserInputError } from "apollo-server-express";

// Response from /api/sirene/v3/etablissements/<VOTRE_SIRET>
interface SearchResponse {
  etablissement: {
    siret: string;
    numero_voie: string;
    type_voie: string;
    libelle_voie: string;
    code_postal: string;
    libelle_commune: string;
    longitude: string;
    latitude: string;
    geo_adresse: string;
    unite_legale: {
      denomination: string;
      activite_principale: string;
    };
  };
}

// Response from /api/sirene/v1/full_text/<CLUE>
interface FullTextSearchResponse {
  etablissement: {
    siret: string;
    nom_raison_sociale: string;
    numero_voie: string;
    type_voie: string;
    libelle_voie: string;
    code_postal: string;
    libelle_commune: string;
    activite_principale: string;
    libelle_activite_principale: string;
    longitude: string;
    latitude: string;
    geo_adresse: string;
  }[];
}

interface CompanySearchResult {
  siret: string;
  address: string;
  name: string;
  naf: string;
  libelleNaf: string;
  longitude: number;
  latitude: number;
}

export const COMPANY_INFOS_CACHE_KEY = "CompanyInfos";
const EXPIRY_TIME = 60 * 60 * 24;

export function getCachedCompanySireneInfo(
  siret: string
): Promise<CompanySearchResult> {
  if (siret.length !== 14) {
    throw new UserInputError("Le siret doit faire 14 caractères", {
      invalidArgs: ["siret"]
    });
  }

  return cachedGet(searchCompany, COMPANY_INFOS_CACHE_KEY, siret, {
    parser: JSON,
    options: { EX: EXPIRY_TIME }
  });
}

const SIRENE_API_BASE_URL = "https://entreprise.data.gouv.fr/api/sirene";

/**
 * Build a full address string from its base components
 */
export function buildAddress(
  streetNumber: string,
  streetType: string,
  streetLabel: string,
  postalCode: string,
  city: string
) {
  return [streetNumber, streetType, streetLabel, postalCode, city]
    .filter(x => !!x)
    .join(" ");
}

function safeParseFloat(f: string) {
  return f ? parseFloat(f) : null;
}

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

  return {
    siret: etablissement.siret,
    address,
    name: etablissement.unite_legale.denomination,
    naf: etablissement.unite_legale.activite_principale,
    libelleNaf: "",
    longitude: safeParseFloat(etablissement.longitude),
    latitude: safeParseFloat(etablissement.latitude)
  };
}

/**
 * Search a company by SIRET
 * @param siret
 */
export function searchCompany(siret: string): Promise<CompanySearchResult> {
  const searchUrl = `${SIRENE_API_BASE_URL}/v3/etablissements/${siret}`;
  return axios
    .get<SearchResponse>(searchUrl)
    .then(r => {
      return searchResponseToCompany(r.data);
    })
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
  let searchUrl = `${SIRENE_API_BASE_URL}/v1/full_text/${clue}`;

  if (department && department.length === 2) {
    searchUrl = `${searchUrl}?departement=${department}`;
  }

  if (department && department.length === 5) {
    // this migth actually be a postal code
    searchUrl = `${searchUrl}?code_postal=${department}`;
  }

  return axios
    .get<FullTextSearchResponse>(searchUrl)
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
