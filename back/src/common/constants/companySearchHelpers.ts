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
 * Validateur de numéro de SIRETs
 */
export const isSiret = (clue: string): boolean =>
  !!clue && /^[0-9]{14}$/.test(clue.replace(/\s/g, ""));

/**
 * Validateur de numéro de TVA
 */
export const isVat = (clue: string): boolean => {
  if (!clue) return false;
  const cleanClue = clue.replace(/\s/g, "");
  if (!cleanClue) return false;
  const isRegexValid = checkVAT(cleanClue, countries);
  return isRegexValid.isValid;
};

/**
 * TVA Français
 */
export const isFRVat = (clue: string): boolean => {
  if (!clue) return false;
  const cleanClue = clue.replace(/\s/g, "");
  if (!cleanClue) return false;
  return cleanClue.slice(0, 2).toUpperCase().startsWith("FR");
};

/**
 * TVA Non-Français
 */
export const isForeignVat = (clue: string): boolean => {
  if (!clue) return false;
  const cleanClue = clue.replace(/\s/g, "");
  if (!cleanClue) return false;
  return (
    isVat(cleanClue) && !cleanClue.slice(0, 2).toUpperCase().startsWith("FR")
  );
};

/**
 * Le numéro OMI est "OMI1234567" (7 chiffres)
 */
export const isOmi = (clue: string): boolean => {
  if (!clue) return false;
  const clean = clue.replace(/\s/g, "");

  return (
    clean.slice(0, 3).toUpperCase().startsWith("OMI") &&
    /[0-9]{7}/.test(clean.slice(3))
  );
};
