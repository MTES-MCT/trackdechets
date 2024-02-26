/**
 * Extract postalCode from address, ie:
 * extractPostalCodeFromAddress("37 RUE JEAN JACQUES NEUFER 57230 BITCHE") = 57230
 */
const POSTAL_CODE_REGEX = new RegExp(/^(?:[0-8]\d|9[0-8])\d{3}$/);
export const extractPostalCodeFromAddress = (
  address?: string
): string | undefined => {
  if (!address) return undefined;

  const clean = address.replace(/,/g, "").split(" ");

  return clean.find(s => s.match(POSTAL_CODE_REGEX));
};
