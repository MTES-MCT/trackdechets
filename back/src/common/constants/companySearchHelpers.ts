import { checkVAT, countries } from "jsvat";

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
