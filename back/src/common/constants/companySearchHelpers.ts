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

// support all environments
let ALLOW_TEST_COMPANY = false;
try {
  ALLOW_TEST_COMPANY = process.env.ALLOW_TEST_COMPANY === "true";
} catch (e) {
  ALLOW_TEST_COMPANY = false;
}

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

/**
 * Validateur de numéro de SIRETs
 */
export const isSiret = (clue: string): boolean => {
  if (!clue) return false;
  const cleanClue = clue.replace(/[\W_]+/g, "");
  if (
    !cleanClue ||
    !/^[0-9]{14}$/.test(cleanClue) ||
    /^0{14}$/.test(cleanClue)
  ) {
    return false;
  }
  if (ALLOW_TEST_COMPANY && cleanClue.startsWith(TEST_COMPANY_PREFIX)) {
    return true;
  }
  const luhnValid = luhnCheck(cleanClue);
  if (luhnValid) {
    return true;
  }
  // try with "5" (default is 10) for La Poste Groupe SIRET
  return luhnCheck(cleanClue, 5);
};

/**
 * Validateur de numéro de TVA
 */
export const isVat = (clue: string): boolean => {
  if (!clue) return false;
  if (clue.match(/[\W_]/gim) !== null) return false;
  const cleanClue = clue.replace(/[\W_]+/g, "");
  if (!cleanClue) return false;
  const isRegexValid = checkVAT(cleanClue, countries);
  return isRegexValid.isValid;
};

/**
 * TVA Français
 */
export const isFRVat = (clue: string): boolean => {
  if (!isVat(clue)) return false;
  const cleanClue = clue.replace(/[\W_]+/g, "");
  if (!cleanClue) return false;
  return cleanClue.slice(0, 2).toUpperCase().startsWith("FR");
};

/**
 * TVA Non-Français
 */
export const isForeignVat = (clue: string): boolean => {
  if (!isVat(clue)) return false;
  const cleanClue = clue.replace(/[\W_]+/g, "");
  if (!cleanClue) return false;
  return !cleanClue.slice(0, 2).toUpperCase().startsWith("FR");
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
