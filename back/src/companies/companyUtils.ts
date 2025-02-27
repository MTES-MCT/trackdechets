import { searchCompany } from "./search";
import { splitAddress } from "../common/addresses";
import { Company } from "@prisma/client";
import { isDefinedStrict } from "../common/helpers";
import type { CompanySearchResult } from "@td/codegen-back";

/**
 * Retourne l'adresse splittée d'une entreprise ('street', 'postalCode', 'city', 'country').
 *
 * Essaie d'abord d'interroger les APIs / ES pour avoir l'adresse splittée,
 * et en cas de souci, essaie de splitter l'adresse manuellement.
 *
 * Si le split n'a pas fonctionné, retourne tous les champs à null.
 *
 * Attention: certaines entreprises ont des addresses du genre "codePostal ville",
 * auquel cas on retourne "" pour la rue.
 */
export const getCompanySplittedAddress = async (company: Company) => {
  let searchedCompany: CompanySearchResult | null = null;
  try {
    searchedCompany = await searchCompany(company.orgId);
  } catch (_) {
    // Peut potentiellement soulever une ClosedCompanyError
  }

  let res;

  // Split manuel...
  if (
    // ...si pas de retour des APIs
    !searchedCompany ||
    // ...si entreprise étrangère
    isDefinedStrict(searchedCompany.codePaysEtrangerEtablissement) ||
    // ...si le retour des APIs ne comprend pas d'adresse fiable
    !isDefinedStrict(searchedCompany?.addressPostalCode?.trim())
  ) {
    res = splitAddress(company.address, company.vatNumber);
  }
  // Sinon, split avec les données retournées par les APIs
  else {
    res = {
      street: searchedCompany.addressVoie,
      postalCode: searchedCompany.addressPostalCode,
      city: searchedCompany.addressCity,
      country: "FR"
    };
  }

  // Un certain nombre d'entreprises ont des addresses du genre "codePostal ville"
  // (donc on tolère l'absence de libellé de voie)
  // Mais s'il manque le code postal ou la ville, on considère l'adresse comme invalide.
  // On retourne null plutôt qu'une adresse semi-complète.
  if (
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
