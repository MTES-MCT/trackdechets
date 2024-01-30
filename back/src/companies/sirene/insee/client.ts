import {
  SearchResponseInsee,
  FullTextSearchResponseInsee,
  SireneSearchResult
} from "../types";
import { libelleFromCodeNaf, buildAddress } from "../utils";
import { authorizedAxiosGet } from "./token";
import { AnonymousCompanyError, SiretNotFoundError } from "../errors";
import { format } from "date-fns";
import { StatutDiffusionEtablissement } from "../../../generated/graphql/types";

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
    name: buildCompanyName(etablissement),
    naf: lastPeriod?.activitePrincipaleEtablissement,
    libelleNaf: libelleFromCodeNaf(
      lastPeriod?.activitePrincipaleEtablissement ?? ""
    ),
    statutDiffusionEtablissement: etablissement.statutDiffusionEtablissement
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
export async function searchCompany(
  siret: string,
  _source_includes?: string[] // ignored
): Promise<SireneSearchResult> {
  const searchUrl = `${SIRENE_API_BASE_URL}/siret/${siret}`;

  try {
    const response = await authorizedAxiosGet<SearchResponseInsee>(searchUrl);
    const company = searchResponseToCompany(response.data);
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

function buildCompanyName({
  etablissement
}: SearchResponseInsee) {
  let companyName = etablissement.uniteLegale.denominationUniteLegale !== "[ND]" ?
    etablissement.uniteLegale.denominationUniteLegale : "";

  const secondaryNamesEtablissement = [
    // > Dénomination usuelle de l’établissement
    // > Cette variable désigne le nom sous lequel l'établissement est connu du grand public.
    // > Cet élément d'identification de l'établissement a été enregistré au niveau établissement depuis l'application
    // > de la norme d'échanges CFE de 2008. Avant la norme 2008, la dénomination usuelle était enregistrée au
    // > niveau de l'unité légale sur trois champs (cf. variables denominationUsuelle1UniteLegale à
    // > denominationUsuelle3UniteLegale dans le descriptif des variables du fichier StockUniteLegale).
    "denominationUsuelleEtablissement",
    // > Les trois variables enseigne1Etablissement, enseigne2Etablissement et enseigne3Etablissement
    // > contiennent la ou les enseignes de l'établissement.
    // > L'enseigne identifie l'emplacement ou le local dans lequel est exercée l'activité. Un établissement peut
    // > posséder une enseigne, plusieurs enseignes ou aucune.
    // > L'analyse des enseignes et de son découpage en trois variables dans Sirene montre deux cas possibles :
    // > soit les 3 champs concernent 3 enseignes bien distinctes, soit ces trois champs correspondent au
    // > découpage de l'enseigne qui est déclarée dans la liasse (sur un seul champ) avec une continuité des trois
    // > champs.
    "enseigne1Etablissement",
    "enseigne2Etablissement",
    "enseigne3Etablissement"
  ];



  // Try to grab useful secondary naming information in different secondary fields
  for (const secondaryName of secondaryNamesEtablissement) {
    if (etablissement[secondaryName] &&
      etablissement[secondaryName].length > 0 &&
      etablissement[secondaryName] !== "[ND]" &&
      etablissement[secondaryName] !== companyName) {
        companyName = companyName ? companyName.concat(` (${etablissement[secondaryName]})`)
          : companyName.concat(` ${etablissement[secondaryName]}`);
        break;
    }
  }
  // > Sigle de l’unité légale
  // > Un sigle est une forme réduite de la raison sociale ou de la dénomination d'une personne morale ou d'un
  // > organisme public.
  // > Il est habituellement constitué des initiales de certains des mots de la dénomination. Afin d'en faciliter la
  // > prononciation, il arrive qu'on retienne les deux ou trois premières lettres de certains mots : il s'agit alors, au
  // > sens strict, d'un acronyme; mais l'usage a étendu à ce cas l'utilisation du terme sigle.
  // > Cette variable est à null pour les personnes physiques.
  // > Elle peut être non renseignée pour les personnes morales
  if (etablissement.uniteLegale.sigleUniteLegale && etablissement.uniteLegale.sigleUniteLegale !== "[ND]" &&
    etablissement.uniteLegale.sigleUniteLegale !== companyName) {
    companyName = companyName.concat(` (${etablissement.uniteLegale.sigleUniteLegale})`);
  }
  return companyName.trim();
}
