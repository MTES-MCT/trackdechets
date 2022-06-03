import { CompanyRow, CompanyInfo } from "./types";
import geocode from "../../companies/geocode";
import { searchCompany } from "../../companies/search";

/**
 * Validate SIRET against SIRENE database and add company name
 * @param companies
 */
export async function sirenify(
  company: CompanyRow
): Promise<CompanyRow & CompanyInfo> {
  const { naf: codeNaf, name, address } = await searchCompany(company.siret);
  const { latitude, longitude } = await geocode(address);
  return {
    ...company,
    address,
    latitude,
    longitude,
    codeNaf,
    name
  };
}
