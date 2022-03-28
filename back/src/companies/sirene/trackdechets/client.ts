import {
  GetResponse,
  QueryDslQueryContainer
} from "@elastic/elasticsearch/api/types";
import { TransportRequestOptions } from "@elastic/elasticsearch/lib/Transport";
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
import { ResponseError } from "@elastic/elasticsearch/lib/errors";

const index = process.env.TD_COMPANY_ELASTICSEARCH_INDEX;

export class CompanyNotFound extends Error {}

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

  const company = {
    siret: etablissement.siret,
    etatAdministratif: etablissement.etatAdministratifEtablissement,
    address: fullAddress,
    addressVoie,
    addressPostalCode: etablissement.codePostalEtablissement,
    addressCity: etablissement.libelleCommuneEtablissement,
    codeCommune: etablissement.codeCommuneEtablissement,
    name: etablissement.denominationUniteLegale,
    naf: etablissement.activitePrincipaleEtablissement,
    libelleNaf: etablissement.activitePrincipaleEtablissement
      ? libelleFromCodeNaf(etablissement.activitePrincipaleEtablissement)
      : ""
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
      // 404 veut peut-être dire non-diffusible, donc on se repose sur `redundancy` pour effectuer un requête sur les api publiques.
      if (error instanceof ResponseError && error.meta.statusCode === 404) {
        throw new CompanyNotFound(ProviderErrors.SiretNotFound);
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
  requestOptions?: Partial<TransportRequestOptions>
): Promise<SireneSearchResult[]> => {
  const qs = removeDiacritics(clue);
  // Multi-match query docs https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html
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
