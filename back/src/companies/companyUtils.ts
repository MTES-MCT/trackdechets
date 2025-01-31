import { searchCompany } from "./search";
import { splitAddress } from "../common/addresses";
import { Company } from "@prisma/client";

export const getCompanySplittedAddress = async (company: Company) => {
  // First try SIRENE data
  const searchedCompany = await searchCompany(company.orgId);

  // If no data or foreign company, try the manual split method
  if (
    !searchedCompany ||
    searchedCompany.codePaysEtrangerEtablissement !== ""
  ) {
    return splitAddress(company.address, company.orgId);
  }

  return {
    street: searchedCompany.addressVoie,
    postalCode: searchedCompany.addressPostalCode,
    city: searchedCompany.addressCity,
    country: "FR"
  };
};
