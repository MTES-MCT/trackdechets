import { splitAddress } from "../common/addresses";
import { Company } from "@td/prisma";
import { isDefinedStrict } from "../common/helpers";
import type { CompanySearchResult } from "@td/codegen-back";

export type AddressCompanySearchResult = Pick<
  CompanySearchResult,
  | "addressVoie"
  | "addressPostalCode"
  | "addressCity"
  | "codePaysEtrangerEtablissement"
>;

interface SplittedAddress {
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

export type CompanyToSplit = Pick<Company, "vatNumber" | "address">;

/**
 * Retourne l'adresse splittée d'une entreprise ('street', 'postalCode', 'city', 'country').
 *
 * Pour éviter de multiplier les appels aux APIs externes, cette fonction fait pas d'appel
 * elle-même et prend en entrée un companySearchResult (partiel).
 *
 * Si le companySearchResult est valide, retourne les champs splittés.
 *
 * Si le companySearchResult mais l'adresse complète de l'entreprise est exploitable, retourne
 * un split manuel.
 *
 * Si le split n'a pas fonctionné, retourne tous les champs à null.
 *
 * Attention: certaines entreprises ont des addresses du genre "codePostal ville",
 * auquel cas on retourne "" pour la rue.
 */
export const getCompanySplittedAddress = (
  companySearchResult: AddressCompanySearchResult | null | undefined,
  company?: CompanyToSplit | null | undefined
): SplittedAddress => {
  let res;

  // Split manuel...
  if (
    // ...si pas de retour des APIs
    !companySearchResult ||
    // ...si entreprise étrangère
    isDefinedStrict(companySearchResult.codePaysEtrangerEtablissement) ||
    // ...si le retour des APIs ne comprend pas d'adresse fiable
    !isDefinedStrict(companySearchResult?.addressPostalCode?.trim()) ||
    // ...si l'adresse n'est pas publique
    companySearchResult.addressVoie?.includes("[ND]") ||
    companySearchResult.addressPostalCode?.includes("[ND]")
  ) {
    res = splitAddress(company?.address, company?.vatNumber);
  }
  // Sinon, split avec les données retournées par les APIs
  else {
    res = {
      street: companySearchResult.addressVoie,
      postalCode: companySearchResult.addressPostalCode,
      city: companySearchResult.addressCity,
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
