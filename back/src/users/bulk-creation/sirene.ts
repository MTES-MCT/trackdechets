import { CompanyRow, CompanyInfo } from "./types";
import { geocode } from "../../companies/geo/geocode";
import { searchCompany } from "../../companies/search";

/**
 * Validate SIRET against SIRENE database and add company name
 * @param companies
 */
export async function sirenify(
  company: CompanyRow
): Promise<CompanyRow & CompanyInfo> {
  const {
    naf: codeNaf,
    name,
    address,
    addressCity,
    addressPostalCode,
    addressVoie,
    codePaysEtrangerEtablissement
  } = await searchCompany(company.siret);
  const { latitude, longitude } = await geocode(address);
  return {
    ...company,
    address,
    addressCity,
    addressPostalCode,
    addressVoie,
    codePaysEtrangerEtablissement,
    latitude,
    longitude,
    codeNaf,
    name
  };
}
