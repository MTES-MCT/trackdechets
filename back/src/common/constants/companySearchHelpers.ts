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
import luhn from "fast-luhn";

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

function siretValidatorLaPosteGroupe(number) {
  const array = [0, 2, 4, 6, 8, 1, 3, 5, 7, 9];
  if (typeof number !== "string") throw new TypeError("Expected string input");
  if (!number) return false;
  let length = number.length;
  let bit = 1;
  let sum = 0;
  let value;

  while (length) {
    value = parseInt(number.charAt(--length), 10);
    bit ^= 1;
    sum += bit ? array[value] : value;
  }

  return sum % 5 === 0;
}

/**
 * Validateur de numéro de SIRETs
 */
export const isSiret = (clue: string): boolean => {
  if (!clue) return false;
  const cleanClue = clue.replace(/[\W_]+/g, "");
  if (!cleanClue || !/^[0-9]{14}$/.test(cleanClue) || /^0{14}$/.test(cleanClue))
    return false;
  const luhnValid = luhn(cleanClue);
  if (luhnValid) return true;
  else if (siretValidatorLaPosteGroupe(cleanClue)) return true;
  return false;
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
