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
 * SIRET number validator
 */
export const isSiret = (clue: string): boolean =>
  !!clue && /^[0-9]{14}$/.test(clue.replace(/\s/g, ""));

/**
 * VAT validator
 * both rules are required, checkVat allows digit-only VAT numbers, may be confusing with SIRET
 */
export const isVat = (clue: string): boolean => {
  if (!clue) return false;
  const isRegextValid = checkVAT(clue.trim(), countries);
  return isRegextValid.isValid;
};

/**
 * French VAT
 */
export const isFRVat = (clue: string): boolean => {
  if (!clue) return false;
  return clue.replace(/\s/g, "").slice(0, 2).toUpperCase().startsWith("FR");
};
