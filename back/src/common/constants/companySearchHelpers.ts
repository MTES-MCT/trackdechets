// Allow front and back usage
import * as process from "process";

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
export const TEST_COMPANY_PREFIX = "000000";

// support all environments front and back
// process.env is not available in frontend JS and import.meta.env not available in node.js
const ALLOW_TEST_COMPANY = process?.env?.ALLOW_TEST_COMPANY === "true";

export const BAD_CHARACTERS_REGEXP = /[\W_]/gim;

/**
 * Implements the Luhn Algorithm used to validate SIRET or SIREN of identification numbers
 */
export const luhnCheck = (num: string | number, modulo = 10): boolean => {
  const arr = (num + "")
    .split("")
    .reverse()
    .map(x => parseInt(x, 10));
  const lastDigit = arr.shift();
  let sum = arr.reduce(
    (acc, val, i) =>
      i % 2 !== 0 ? acc + val : acc + ((val *= 2) > 9 ? val - 9 : val),
    0
  );
  sum += lastDigit ?? 0;
  return sum % modulo === 0;
};

export const cleanClue = (clue: string): string =>
  clue ? clue.replace(BAD_CHARACTERS_REGEXP, "").toUpperCase() : "";

/**
 * Validateur de numéro de SIRETs
 * @param clue string to validate
 * @param allowTestCompany For the frontend to pass ALLOW_TEST_COMPANY
 * @returns
 */
export const isSiret = (
  clue: string | null | undefined,
  allowTestCompany?: boolean
): boolean => {
  const allowTest =
    allowTestCompany !== undefined ? allowTestCompany : ALLOW_TEST_COMPANY;
  if (!clue || !/^[0-9]{14}$/.test(clue) || /^0{14}$/.test(clue)) {
    return false;
  }
  if (allowTest && clue.startsWith(TEST_COMPANY_PREFIX)) {
    return true;
  }
  // La Poste groupe specific rule (except for headquarters 35600000000048 that pass luhnChack)
  if (clue.startsWith("356000000") && clue !== "35600000000048") {
    return clue.split("").reduce((a, b) => a + parseInt(b, 10), 0) % 5 === 0;
  }
  // "Trackdechets secours" company by-pass
  if (clue === "11111111192062") {
    return true;
  }
  return luhnCheck(clue);
};

/**
 * Validateur de numéro de TVA
 */
export const isVat = (clue: string | null | undefined): boolean => {
  if (!clue || clue.match(BAD_CHARACTERS_REGEXP) !== null) return false;
  const isRegexValid = checkVAT(clue, countries);
  return isRegexValid.isValid;
};

/**
 * Return the french VAT key for a SIREN (first 2 numbers of the VAT)
 */
const sirenToVatKey = (siren: string): number =>
  (12 + 3 * (parseInt(siren, 10) % 97)) % 97;

/**
 * TVA Français
 */
export const isFRVat = (clue: string | null | undefined): boolean => {
  if (
    !isVat(clue) ||
    clue?.length !== 13 ||
    !clue.slice(0, 2).toUpperCase().startsWith("FR")
  ) {
    return false;
  }
  const siren = clue.slice(4);
  return (
    sirenToVatKey(siren) === parseInt(clue.slice(2, 4), 10) && luhnCheck(siren)
  );
};

/**
 * TVA Non-Français
 */
export const isForeignVat = (clue: string | null | undefined): boolean => {
  if (!isVat(clue)) return false;
  return !isFRVat(clue);
};

/**
 * Le numéro OMI est "OMI1234567" (7 chiffres)
 */
export const isOmi = (clue: string | null | undefined): boolean => {
  if (!clue) return false;
  if (clue.match(BAD_CHARACTERS_REGEXP) !== null) return false;
  return clue.match(/^OMI[0-9]{7}$/gim) !== null;
};

export type PartialTransporterCompany = {
  transporterCompanySiret: string | null;
  transporterCompanyVatNumber: string | null;
};

/**
 * Works with any BSD in order to provide a default orgId
 */
export const getTransporterCompanyOrgId = (
  form: PartialTransporterCompany | null
): string | null => {
  if (!form) return null;
  return form.transporterCompanySiret?.length
    ? form.transporterCompanySiret
    : form.transporterCompanyVatNumber;
};

/**
 * Check for etatAdministratif
 */
export const isClosedCompany = (companyInfos: any) =>
  companyInfos.etatAdministratif === "F";

export const CLOSED_COMPANY_ERROR =
  "Impossible de créer un établissement fermé selon l'INSEE";
