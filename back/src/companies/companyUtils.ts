import { searchCompany } from "./search";
import { splitAddress } from "../common/addresses";
import { Company } from "@prisma/client";
import { isDefinedStrict } from "../common/helpers";

export const getCompanySplittedAddress = async (company: Company) => {
  const searchedCompany = await searchCompany(company.orgId);

  let res;

  // Split manuel...
  if (
    // ...si pas de retour des APIs
    !searchedCompany ||
    // ...si entreprise étrangère
    isDefinedStrict(searchedCompany.codePaysEtrangerEtablissement) ||
    // ...si le retour des APIs ne comprend pas d'adresse
    !isDefinedStrict(searchedCompany?.addressVoie?.trim())
  ) {
    res = splitAddress(company.address, company.vatNumber);
  }
  // Split automatique avec les données retournées par l'API
  else {
    res = {
      street: searchedCompany.addressVoie,
      postalCode: searchedCompany.addressPostalCode,
      city: searchedCompany.addressCity,
      country: "FR"
    };
  }

  // On ne retourne pas de demi-résultat. Si le split n'a pas marché, on
  // ne sauvegarde rien en base
  if (
    !isDefinedStrict(res.street?.trim()) ||
    !isDefinedStrict(res.postalCode?.trim()) ||
    !isDefinedStrict(res.city?.trim())
  ) {
    return {
      street: null,
      postalCode: null,
      city: null,
      country: null
    };
  }

  return res;
};
