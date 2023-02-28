import {
  GetResponse,
  QueryDslQueryContainer
} from "@elastic/elasticsearch/api/types";
import { errors } from "@elastic/elasticsearch";
import logger from "../../../logging/logger";
import { libelleFromCodeNaf, buildAddress, removeDiacritics } from "../utils";
import { AnonymousCompanyError } from "../errors";
import { SireneSearchResult } from "../types";
import {
  SearchHit,
  SearchOptions,
  SearchResponse,
  SearchStockEtablissement,
  ProviderErrors
} from "./types";
import client from "./esClient";

const { ResponseError } = errors;
const index = process.env.TD_COMPANY_ELASTICSEARCH_INDEX;

/**
 * Specific Error class
 * to handle falling back to INSEE API client for hidden companies in public data
 * check redundancy.ts for processing company search client errors
 */
export class CompanyNotFoundInTrackdechetsSearch extends Error {}

/**
 * Build a company object from a search response
 * @param data etablissement response object
 */
const searchResponseToCompany = (
  etablissement: SearchStockEtablissement
): SireneSearchResult => {
  const addressVoie = buildAddress([
    etablissement.numeroVoieEtablissement,
    etablissement.indiceRepetitionEtablissement,
    etablissement.typeVoieEtablissement,
    etablissement.libelleVoieEtablissement,
    etablissement.complementAdresseEtablissement
  ]);

  const fullAddress = buildAddress([
    addressVoie,
    etablissement.codePostalEtablissement,
    etablissement.libelleCommuneEtablissement
  ]);

  let companyName = etablissement.denominationUniteLegale;
  if (etablissement.sigleUniteLegale?.length > 0) {
    companyName = companyName.concat(` (${etablissement.sigleUniteLegale})`);
  } else if (etablissement.enseigne1Etablissement?.length > 0) {
    companyName = companyName.concat(
      ` (${etablissement.enseigne1Etablissement})`
    );
  }

  const company: SireneSearchResult = {
    siret: etablissement.siret,
    etatAdministratif: etablissement.etatAdministratifEtablissement,
    address: fullAddress,
    addressVoie,
    addressPostalCode: etablissement.codePostalEtablissement,
    addressCity: etablissement.libelleCommuneEtablissement,
    codeCommune: etablissement.codeCommuneEtablissement,
    name: companyName,
    naf: etablissement.activitePrincipaleEtablissement,
    libelleNaf: etablissement.activitePrincipaleEtablissement
      ? libelleFromCodeNaf(etablissement.activitePrincipaleEtablissement)
      : "",
    statutDiffusionEtablissement: etablissement.statutDiffusionEtablissement,
    // La variable codePaysEtrangerEtablissement commence toujours par 99 si elle est renseignée dans la base sirene INSEE
    // Les 3 caractères suivants sont le code du pays étranger.
    codePaysEtrangerEtablissement: etablissement.codePaysEtrangerEtablissement
  };

  const isEntrepreneurIndividuel =
    etablissement.categorieJuridiqueUniteLegale === "1000";

  if (isEntrepreneurIndividuel) {
    // concatenate prénom et nom
    company.name = [
      etablissement.prenom1UniteLegale,
      etablissement.nomUniteLegale
    ]
      .join(" ")
      .trim();
  }

  return company;
};

/**
 * Search a company by SIRET
 * @param siret
 */
export const searchCompany = (siret: string): Promise<SireneSearchResult> =>
  client
    .get<GetResponse<SearchStockEtablissement>>({
      id: siret,
      index
    })
    .then(r => {
      if (r.warnings) {
        logger.warn(r.warnings);
      }
      if (r.body._source.statutDiffusionEtablissement === "N") {
        throw new AnonymousCompanyError();
      }
      return searchResponseToCompany(r.body._source);
    })
    .catch((error: Error) => {
      if (error instanceof AnonymousCompanyError) {
        throw error;
      }
      // 404 may mean Anonymous Company
      // rely on `redundancy` to fallback on INSEE api to verify that or if SIRET does not exists.
      if (error instanceof ResponseError && error.meta.statusCode === 404) {
        throw new CompanyNotFoundInTrackdechetsSearch(
          ProviderErrors.SiretNotFound
        );
      }
      logger.error(
        `${ProviderErrors.ServerError}: ${error.name}, ${error.message}, \n`,
        { stacktrace: error.stack }
      );
      throw new Error(ProviderErrors.ServerError);
    });

/**
 * Build a list of company objects from a full text search response
 */
const fullTextSearchResponseToCompanies = (
  r: SearchHit[]
): SireneSearchResult[] =>
  r.map(({ _source }) => searchResponseToCompany(_source));

/**
 * Full text search
 */
export const searchCompanies = (
  clue: string,
  department?: string,
  options?: Partial<SearchOptions>,
  requestOptions?
): Promise<SireneSearchResult[]> => {
  const qs = removeDiacritics(clue);
  // Match query on the merged field td_search_companies
  const must: QueryDslQueryContainer[] = [
    {
      match: {
        // field created during indexation from the copy of multiple fields
        // check this in indexInseeSiret.ts and "stocketablissement" index mapping
        td_search_companies: {
          query: qs,
          operator: "or"
        }
      }
    }
  ];

  if (department?.length >= 2 && department?.length <= 3) {
    // this might a french department code
    must.push({
      wildcard: { codePostalEtablissement: `${department}*` }
    });
  }

  if (department?.length === 5) {
    // this might be a french postal code
    must.push({
      term: { codePostalEtablissement: department }
    });
  }

  const searchRequest: SearchOptions = {
    ...options,
    index,
    // default_operator: "OR",
    body: {
      // QueryDSL docs https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
      query: {
        bool: {
          must
        }
      }
    }
  };

  return client
    .search<SearchResponse>(searchRequest, requestOptions)
    .then(r => {
      if (r.body.timed_out) {
        throw new Error(`Server timed out`);
      }
      if (r.warnings) {
        logger.warn(r.warnings);
      }
      return fullTextSearchResponseToCompanies(r.body.hits.hits);
    })
    .catch(error => {
      logger.error(`${ProviderErrors.ServerError}\n`, error);
      throw new Error(ProviderErrors.ServerError);
    });
};
