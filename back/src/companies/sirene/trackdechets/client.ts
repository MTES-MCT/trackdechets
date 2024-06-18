import { errors, estypes } from "@elastic/elasticsearch";
import { logger } from "@td/logger";
import { libelleFromCodeNaf, buildAddress, removeDiacritics } from "../utils";
import {
  AnonymousCompanyError,
  ClosedCompanyError,
  SiretNotFoundError
} from "../errors";
import { SireneSearchResult } from "../types";
import {
  SearchHit,
  SearchOptions,
  SearchResponse,
  SearchStockEtablissement
} from "./types";
import client from "./esClient";
import { SEARCH_COMPANIES_MAX_SIZE } from "../insee/client";
import {
  EtatAdministratif,
  StatutDiffusionEtablissement
} from "../../../generated/graphql/types";
import { prisma } from "../../../../../libs/back/prisma/src";

const { ResponseError } = errors;
/**
 * Index "stocketablissement" created thanks to
 * https://github.com/MTES-MCT/trackdechets-sirene-search
 */
const index = process.env.TD_COMPANY_ELASTICSEARCH_INDEX;

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

  const company: SireneSearchResult = {
    siret: etablissement.siret,
    etatAdministratif:
      etablissement.etatAdministratifEtablissement ||
      (etablissement.etatAdministratifUniteLegale === "C" ? "F" : "A"),
    address: fullAddress,
    addressVoie,
    addressPostalCode: etablissement.codePostalEtablissement,
    addressCity: etablissement.libelleCommuneEtablissement,
    codeCommune: etablissement.codeCommuneEtablissement,
    name: buildCompanyName(etablissement),
    naf: etablissement.activitePrincipaleEtablissement,
    libelleNaf: libelleFromCodeNaf(
      etablissement.activitePrincipaleEtablissement
    ),
    statutDiffusionEtablissement: etablissement.statutDiffusionEtablissement,
    // La variable codePaysEtrangerEtablissement commence toujours par 99 si elle est renseignée dans la base sirene INSEE
    // Les 3 caractères suivants sont le code du pays étranger.
    codePaysEtrangerEtablissement: etablissement.codePaysEtrangerEtablissement
  };

  return company;
};

/**
 * Search a company by SIRET
 * @param siret
 */
export const searchCompany = async (
  siret: string
): Promise<SireneSearchResult> => {
  try {
    console.log(">> TD searchCompany");
    const response = await client.search<SearchResponse>({
      index,
      body: {
        query: {
          term: {
            siret: {
              value: siret
            }
          }
        }
      }
    });
    console.log("response", response);

    if (!response.body.hits.hits || !response.body.hits.hits[0]?._source) {
      throw new SiretNotFoundError();
    }
    const company = searchResponseToCompany(response.body.hits.hits[0]._source);
    console.log("TD company", company);

    if (company.etatAdministratif === ("F" as EtatAdministratif)) {
      throw new ClosedCompanyError();
    }

    if (
      company.statutDiffusionEtablissement ===
      ("P" as StatutDiffusionEtablissement)
    ) {
      throw new AnonymousCompanyError();
    }
    return company;
  } catch (error) {
    // Special companies
    const companyInDB = await prisma.company.findFirst({
      where: { orgId: siret }
    });
    if (companyInDB) {
      return {
        ...companyInDB,
        statutDiffusionEtablissement: "O" as StatutDiffusionEtablissement
      };
    }

    console.log("error", error);
    if (error instanceof ResponseError && error.meta.statusCode === 404) {
      throw new SiretNotFoundError();
    }
    logger.error(`"Erreur inconnue": ${error.name}, ${error.message}, \n`, {
      stacktrace: error.stack
    });

    throw error;
  }
};

/**
 * Build a list of company objects from a full text search response
 */
const fullTextSearchResponseToCompanies = (
  r: SearchHit[]
): SireneSearchResult[] =>
  r.map(({ _source }) => searchResponseToCompany(_source));

/**
 * Search a Company with a full-text search query
 */
export const searchCompanies = (
  clue: string,
  department?: string,
  options?: Partial<SearchOptions>,
  requestOptions?
): Promise<SireneSearchResult[]> => {
  const qs = removeDiacritics(clue);
  // Match query on the merged field td_search_companies
  const must: estypes.QueryContainer[] = [
    {
      match: {
        // the field 'td_search_companies' is created during indexation from the copy of multiple fields
        // check this in search/src/indexation code.
        td_search_companies: {
          query: qs
        }
      }
    }
  ];

  if (department?.length === 2 || department?.length === 3) {
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
    _source_excludes: "td_search_companies",
    size: SEARCH_COMPANIES_MAX_SIZE,
    index,
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
      logger.error(`Erreur de requete à ElasticSearch SIRENE\n`, error);
      throw error;
    });
};

/**
 * Construit une Raison Sociale composite
 * @param etablissement
 * @returns
 */
function buildCompanyName(etablissement: SearchStockEtablissement) {
  // Certaines unités légales sont non-diffusibles (ND) alors que l'établissement sont ouvertes.
  let companyName =
    etablissement.denominationUniteLegale !== "[ND]"
      ? etablissement.denominationUniteLegale
      : "";

  const secondaryNames = [
    // Dénomination usuelle de l’établissement
    // Cette variable désigne le nom sous lequel l'établissement est connu du grand public.
    // Cet élément d'identification de l'établissement a été enregistré au niveau établissement depuis l'application
    // de la norme d'échanges CFE de 2008. Avant la norme 2008, la dénomination usuelle était enregistrée au
    // niveau de l'unité légale sur trois champs (cf. variables denominationUsuelle1UniteLegale à
    // denominationUsuelle3UniteLegale dans le descriptif des variables du fichier StockUniteLegale).
    "denominationUsuelleEtablissement",
    "denominationUsuelle1UniteLegale",
    "denominationUsuelle2UniteLegale",
    "denominationUsuelle3UniteLegale",
    // Les trois variables enseigne1Etablissement, enseigne2Etablissement et enseigne3Etablissement
    // contiennent la ou les enseignes de l'établissement.
    // L'enseigne identifie l'emplacement ou le local dans lequel est exercée l'activité. Un établissement peut
    // posséder une enseigne, plusieurs enseignes ou aucune.
    // L'analyse des enseignes et de son découpage en trois variables dans Sirene montre deux cas possibles :
    // soit les 3 champs concernent 3 enseignes bien distinctes, soit ces trois champs correspondent au
    // découpage de l'enseigne qui est déclarée dans la liasse (sur un seul champ) avec une continuité des trois
    // champs.
    "enseigne1Etablissement",
    "enseigne2Etablissement",
    "enseigne3Etablissement",
    // Sigle de l’unité légale
    // Un sigle est une forme réduite de la raison sociale ou de la dénomination d'une personne morale ou d'un
    // organisme public.
    // Il est habituellement constitué des initiales de certains des mots de la dénomination. Afin d'en faciliter la
    // prononciation, il arrive qu'on retienne les deux ou trois premières lettres de certains mots : il s'agit alors, au
    // sens strict, d'un acronyme; mais l'usage a étendu à ce cas l'utilisation du terme sigle.
    // Cette variable est à null pour les personnes physiques.
    // Elle peut être non renseignée pour les personnes morales
    "sigleUniteLegale"
  ];

  // Try to grab useful secondary naming information in different secondary fields
  for (const secondaryName of secondaryNames) {
    if (
      etablissement[secondaryName] &&
      etablissement[secondaryName].length > 0 &&
      etablissement[secondaryName] !== companyName
    ) {
      companyName = companyName
        ? companyName.concat(` (${etablissement[secondaryName]})`)
        : companyName.concat(` ${etablissement[secondaryName]}`);

      break;
    }
  }

  // Fallback
  if (!companyName) {
    const isEntrepreneurIndividuel =
      etablissement.categorieJuridiqueUniteLegale === "1000";
    if (isEntrepreneurIndividuel) {
      // concatener prénom et nom
      companyName = [
        etablissement.prenom1UniteLegale,
        etablissement.nomUniteLegale
      ]
        .join(" ")
        .trim();
    } else {
      // afficher denominationUniteLegale quoiqu'il arrive
      companyName = etablissement.denominationUniteLegale;
    }
  }

  return companyName?.trim();
}
