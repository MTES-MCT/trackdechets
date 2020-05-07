import { CompanyRow } from "./types";
import axios from "axios";
import { CompanyInfo } from "./types";

const API_SIRENE_BASE_URL =
  "https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/";

/**
 * Get company info from API SIRENE
 * @param siret
 */
function getCompany(siret: string): Promise<CompanyInfo> {
  return axios
    .get<CompanyInfo>(`${API_SIRENE_BASE_URL}${siret}`)
    .then(resp => resp.data);
}

/**
 * Throttled version of getCompanyInfo to avoid hitting rate limit
 * We wait 1s before executing the function
 * @param siret
 */
export function getCompanyThrottled(siret: string): Promise<CompanyInfo> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      getCompany(siret)
        .then(c => resolve(c))
        .catch(err => reject(err));
    }, 1000);
  });
}

/**
 * Validate SIRET against SIRENE database and add company name
 * @param companies
 */
export async function sirenify(company: CompanyRow): Promise<CompanyRow> {
  try {
    const companyInfo = await getCompanyThrottled(company.siret);
    return {
      ...company,
      name: companyInfo.etablissement.unite_legale.denomination,
      codeNaf: companyInfo.etablissement.activite_principale
    };
  } catch (err) {
    throw new Error(`SIRET ${company.siret} does not exist`);
  }
}
