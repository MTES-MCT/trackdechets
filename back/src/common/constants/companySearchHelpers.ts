import {
  checkVAT,
  andorra,
  austria,
  belgium,
  bulgaria,
  croatia,
  cyprus,
  czechRepublic,
  denmark,
  estonia,
  finland,
  france,
  germany,
  greece,
  hungary,
  ireland,
  italy,
  latvia,
  lithuania,
  luxembourg,
  malta,
  netherlands,
  norway,
  poland,
  portugal,
  romania,
  serbia,
  slovakiaRepublic,
  slovenia,
  spain,
  sweden,
  switzerland,
  unitedKingdom
} from "jsvat";

import { CompanySearchResult } from "../../companies/types";

export const countries = [
  andorra,
  austria,
  belgium,
  bulgaria,
  croatia,
  cyprus,
  czechRepublic,
  denmark,
  estonia,
  finland,
  france,
  germany,
  greece,
  hungary,
  ireland,
  italy,
  latvia,
  lithuania,
  luxembourg,
  malta,
  netherlands,
  norway,
  poland,
  portugal,
  romania,
  serbia,
  slovakiaRepublic,
  slovenia,
  spain,
  sweden,
  switzerland,
  unitedKingdom
];

export const MONACO_ADDRESS_REGEXP = /98[0-9]{3}\s+MONACO/gim;

/**
 * Validateur de numéro de SIRETs
 */
export const isSiret = (clue: string): boolean =>
  !!clue && /^[0-9]{14}$/.test(clue.replace(/[\W_]+/g, ""));

/**
 * Validateur de numéro de TVA
 */
export const isVat = (clue: string): boolean => {
  if (!clue) return false;
  if (clue.match(/[\W_]/gim) !== null) return false;
  const cleanClue = clue.replace(/[\W_]+/g, "");
  if (!cleanClue) return false;
  return checkVAT(cleanClue, countries).isValid;
};

/**
 * TVA Non-Français
 */
export const isForeignVat = (clue: string, address: string): boolean => {
  if (!isVat(clue)) return false;
  const cleanClue = clue.replace(/[\W_]+/g, "");
  if (!cleanClue) return false;
  const isForeignPrefix = !cleanClue.slice(0, 2).toUpperCase().startsWith("FR");
  if (!isForeignPrefix && !!address) {
    if (!!address.match(MONACO_ADDRESS_REGEXP)) {
      return true;
    }
  }
  return isForeignPrefix;
};

/**
 * TVA Français
 */
export const isFRVat = (clue: string, address: string): boolean => {
  return !isForeignVat(clue, address);
};

/**
 * Le numéro OMI est "OMI1234567" (7 chiffres)
 */
export const isOmi = (clue: string): boolean => {
  if (!clue) return false;
  if (clue.match(/[\W_]/gim) !== null) return false;
  const clean = clue.replace(/[\W_]+/g, "");
  return clean.match(/^OMI[0-9]{7}$/gim) !== null;
};

export function getCountryFromVAT(company: CompanySearchResult): string {
  const vatCountryCode: string = checkVAT(company.vatNumber, countries).country
    ?.isoCode.short;

  if (vatCountryCode === "FR") {
    // check Monaco
    if (!!company.address.match(MONACO_ADDRESS_REGEXP)) {
      return "MC";
    }
  }
  return vatCountryCode;
}
