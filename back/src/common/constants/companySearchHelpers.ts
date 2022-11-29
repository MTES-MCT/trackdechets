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

/**
 * Implements the Luhn Algorithm used to validate SIRET or SIREN of identification numbers
 */
export const luhnCheck = (num: string | number, modulo = 10) => {
  const arr = (num + "")
    .split("")
    .reverse()
    .map(x => parseInt(x));
  const lastDigit = arr.shift();
  let sum = arr.reduce(
    (acc, val, i) =>
      i % 2 !== 0 ? acc + val : acc + ((val *= 2) > 9 ? val - 9 : val),
    0
  );
  sum += lastDigit;
  return sum % modulo === 0;
};

/**
 * Validateur de numéro de SIRETs
 */
export const isSiret = (clue: string): boolean => {
  if (!clue) return false;
  const cleanClue = clue.replace(/[\W_]+/g, "");
  if (!cleanClue || !/^[0-9]{14}$/.test(cleanClue) || /^0{14}$/.test(cleanClue))
    return false;
  const luhnValid = luhnCheck(cleanClue);
  if (luhnValid) return true;
  else if (luhnCheck(cleanClue, 5)) return true;
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
