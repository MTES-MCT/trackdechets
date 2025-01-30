import { searchCompany } from "./search";
import { splitAddress } from "../common/addresses";
import { Company } from "@prisma/client";

export const getCompanySplittedAddress = async (company: Company) => {
  // First try SIRENE data
  const searchedCompany = await searchCompany(company.orgId);

  if (searchedCompany) {
    return {
      street: searchedCompany.addressVoie,
      postalCode: searchedCompany.addressPostalCode,
      city: searchedCompany.addressCity,
      country: searchedCompany.codePaysEtrangerEtablissement ?? "FR"
    };
  }

  // If no data, try the manual split method
  return splitAddress(company.address);
};
