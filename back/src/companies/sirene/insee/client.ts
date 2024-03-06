import {
  SearchResponseInsee,
  FullTextSearchResponseInsee,
  SireneSearchResult
} from "../types";
import { libelleFromCodeNaf, buildAddress } from "../utils";
import { authorizedAxiosGet } from "./token";
import {
  AnonymousCompanyError,
  ClosedCompanyError,
  SiretNotFoundError
} from "../errors";
import { format } from "date-fns";
import {
  EtatAdministratif,
  StatutDiffusionEtablissement
} from "../../../generated/graphql/types";

const SIRENE_API_BASE_URL = "https://api.insee.fr/entreprises/sirene/V3";
export const SEARCH_COMPANIES_MAX_SIZE = 20;

/**
 * Build a company object from a search response
 * @param data etablissement response object
 */
function searchResponseToCompany({
  etablissement
}: SearchResponseInsee): SireneSearchResult {
  const addressVoie = buildAddress([
    etablissement.adresseEtablissement.numeroVoieEtablissement,
    etablissement.adresseEtablissement.indiceRepetitionEtablissement,
    etablissement.adresseEtablissement.typeVoieEtablissement,
    etablissement.adresseEtablissement.libelleVoieEtablissement,
    etablissement.adresseEtablissement.complementAdresseEtablissement
  ]);

  const fullAddress = buildAddress([
    addressVoie,
    etablissement.adresseEtablissement.codePostalEtablissement,
    etablissement.adresseEtablissement.libelleCommuneEtablissement
  ]);

  const lastPeriod = etablissement.periodesEtablissement?.length
    ? etablissement.periodesEtablissement[0]
    : null;

  const company = {
    siret: etablissement.siret,
    etatAdministratif: lastPeriod?.etatAdministratifEtablissement,
    address: fullAddress,
    addressVoie,
    addressPostalCode:
      etablissement.adresseEtablissement.codePostalEtablissement,
    addressCity: etablissement.adresseEtablissement.libelleCommuneEtablissement,
    codeCommune: etablissement.adresseEtablissement.codeCommuneEtablissement,
    name: etablissement.uniteLegale.denominationUniteLegale,
    naf: lastPeriod?.activitePrincipaleEtablissement,
    libelleNaf: libelleFromCodeNaf(
      lastPeriod?.activitePrincipaleEtablissement ?? ""
    ),
    statutDiffusionEtablissement: etablissement.statutDiffusionEtablissement
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
export async function searchCompany(
  siret: string,
  _source_includes?: string[] // ignored
): Promise<SireneSearchResult> {
  const searchUrl = `${SIRENE_API_BASE_URL}/siret/${siret}`;

  try {
    const response = await authorizedAxiosGet<SearchResponseInsee>(searchUrl);
    const company = searchResponseToCompany(response.data);

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
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (error.response?.status === 404) {
      // 404 "no results found"
      throw new SiretNotFoundError();
    }
    if (error.response?.status === 403) {
      // this is not supposed to happen anymore since https://www.insee.fr/fr/information/6683782
      throw new AnonymousCompanyError();
    }

    throw error;
  }
}

/**
 * Build a list of company objects from a full text search response
 * @param data etablissement response object
 */
function fullTextSearchResponseToCompanies(
  r: FullTextSearchResponseInsee
): SireneSearchResult[] {
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
): Promise<SireneSearchResult[]> {
  // list of filters to pass as "q" arguments
  const filters: string[] = [];

  const today = format(new Date(), "yyyy-MM-dd");

  // exclude closed companies
  filters.push(`periode(etatAdministratifEtablissement:A)`);

  if (/[0-9]{14}/.test(clue)) {
    // clue is formatted like a SIRET
    filters.push(`siret:${clue}`);
  } else {
    filters.push(`denominationUniteLegale:"*${clue}*"~`);
  }

  if (department) {
    filters.push(`codePostalEtablissement:${department}*`);
  }

  // the date parameter allows to apply the filter on current period
  const q = `${filters.join(" AND ")} &date=${today}`;

  const searchUrl = `${SIRENE_API_BASE_URL}/siret?q=${q}&nombre=${SEARCH_COMPANIES_MAX_SIZE}`;

  // API docs https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3&provider=insee#!/Etablissement/findSiretByQ
  // Nombre d'éléments demandés dans la réponse, défaut 20
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
