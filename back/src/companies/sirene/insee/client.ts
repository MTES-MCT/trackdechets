import {
  SearchResponseInsee,
  CompanySearchResult,
  FullTextSearchResponseInsee
} from "../types";
import { libelleFromCodeNaf, buildAddress } from "../utils";
import { UserInputError } from "apollo-server-express";
import { authorizedAxiosGet } from "./token";

const SIRENE_API_BASE_URL = "https://api.insee.fr/entreprises/sirene/V3";

/**
 * Build a company object from a search response
 * @param data etablissement response object
 */
function searchResponseToCompany({
  etablissement
}: SearchResponseInsee): CompanySearchResult {
  const address = buildAddress(
    etablissement.adresseEtablissement.numeroVoieEtablissement,
    etablissement.adresseEtablissement.typeVoieEtablissement,
    etablissement.adresseEtablissement.libelleVoieEtablissement,
    etablissement.adresseEtablissement.codePostalEtablissement,
    etablissement.adresseEtablissement.libelleCommuneEtablissement
  );

  const company = {
    siret: etablissement.siret,
    etatAdministratif: etablissement.uniteLegale.etatAdministratifUniteLegale,
    address,
    codeCommune: etablissement.adresseEtablissement.codeCommuneEtablissement,
    name: etablissement.uniteLegale.denominationUniteLegale,
    naf: etablissement.uniteLegale.activitePrincipaleUniteLegale,
    libelleNaf: ""
  };

  if (company.naf) {
    company.libelleNaf = libelleFromCodeNaf(company.naf);
  }

  const isEntrepreneurIndividuel =
    etablissement.uniteLegale.categorieJuridiqueUniteLegale === "1000";

  if (isEntrepreneurIndividuel) {
    // concatenate prénom et nom
    company.name = [
      etablissement.uniteLegale.prenom1UniteLegale,
      etablissement.uniteLegale.nomUniteLegale
    ]
      .join(" ")
      .trim();
  }

  return company;
}

/**
 * Search a company by SIRET
 * @param siret
 */
export function searchCompany(siret: string): Promise<CompanySearchResult> {
  const searchUrl = `${SIRENE_API_BASE_URL}/siret/${siret}`;

  return authorizedAxiosGet<SearchResponseInsee>(searchUrl)
    .then(r => searchResponseToCompany(r.data))
    .catch(error => {
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
 * Build a list of company objects from a full text search response
 * @param data etablissement response object
 */
function fullTextSearchResponseToCompanies(
  r: FullTextSearchResponseInsee
): CompanySearchResult[] {
  return r.etablissements.map(etablissement =>
    searchResponseToCompany({ etablissement })
  );
}

/**
 * Full text search in SIRENE database
 *
 * @param clue search string
 * @param department department filter
 */
export function searchCompanies(
  clue: string,
  department?: string
): Promise<CompanySearchResult[]> {
  // list of filters to pass as "q" arguments
  const filters = [];

  // exclude closed companies
  filters.push(`etatAdministratifUniteLegale:A`);

  if (/[0-9]{14}/.test(clue)) {
    // clue is formatted like a SIRET
    filters.push(`siret:${clue}`);
  } else {
    filters.push(`denominationUniteLegale:"*${clue}*"~`);
  }

  if (department) {
    filters.push(`codePostalEtablissement:${department}*`);
  }

  const searchUrl = `${SIRENE_API_BASE_URL}/siret?q=${filters.join(" AND ")}`;

  return authorizedAxiosGet<FullTextSearchResponseInsee>(searchUrl)
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
