import { checkVAT, countries } from "jsvat";

// Source: https://github.com/unicode-org/cldr/blob/release-26-0-1/common/supplemental/postalCodeData.xml
// SO: https://stackoverflow.com/questions/578406/what-is-the-ultimate-postal-code-and-zip-regex
const POSTAL_CODE_REGEX_PER_COUNTRY = {
  GB: "([A-Z][A-HJ-Y]?[0-9][A-Z0-9]? ?[0-9][A-Z]{2}|GIR ?0A{2})",
  JE: "JE[0-9][[0-9]A-Z]?[ ]?[0-9][ABD-HJLN-UW-Z]{2}",
  GG: "GY[0-9][[0-9]A-Z]?[ ]?[0-9][ABD-HJLN-UW-Z]{2}",
  IM: "IM[0-9][[0-9]A-Z]?[ ]?[0-9][ABD-HJLN-UW-Z]{2}",
  US: "[0-9]{5}([ -][0-9]{4})?",
  CA: "[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJ-NPRSTV-Z][ ]?[0-9][ABCEGHJ-NPRSTV-Z][0-9]",
  DE: "(D-|DE-)?[0-9]{5}",
  JP: "[0-9]{3}-[0-9]{4}",
  FR: "[0-9]{2}[ ]?[0-9]{3}",
  AU: "[0-9]{4}",
  IT: "[0-9]{5}",
  CH: "[0-9]{4}",
  AT: "(AT-)?[0-9]{4}",
  ES: "[0-9]{5}",
  NL: "[0-9]{4}[ ]?[A-Z]{2}",
  BE: "[0-9]{4}",
  DK: "[0-9]{4}",
  SE: "[0-9]{3}[ ]?[0-9]{2}",
  NO: "[0-9]{4}",
  BR: "[0-9]{5}[-]?[0-9]{3}",
  PT: "[0-9]{4}([-][0-9]{3})?",
  FI: "[0-9]{5}",
  AX: "22[0-9]{3}",
  KR: "[0-9]{3}[-][0-9]{3}",
  CN: "[0-9]{6}",
  TW: "[0-9]{3}([0-9]{2})?",
  SG: "[0-9]{6}",
  DZ: "[0-9]{5}",
  AD: "AD[0-9]{3}",
  AR: "([A-HJ-NP-Z])?[0-9]{4}([A-Z]{3})?",
  AM: "(37)?[0-9]{4}",
  AZ: "[0-9]{4}",
  BH: "((1[0-2]|[2-9])[0-9]{2})?",
  BD: "[0-9]{4}",
  BB: "(BB[0-9]{5})?",
  BY: "[0-9]{6}",
  BM: "[A-Z]{2}[ ]?[A-Z0-9]{2}",
  BA: "[0-9]{5}",
  IO: "BBND 1ZZ",
  BN: "[A-Z]{2}[ ]?[0-9]{4}",
  BG: "[0-9]{4}",
  KH: "[0-9]{5}",
  CV: "[0-9]{4}",
  CL: "[0-9]{7}",
  CR: "[0-9]{4,5}|[0-9]{3}-[0-9]{4}",
  HR: "[0-9]{5}",
  CY: "[0-9]{4}",
  CZ: "[0-9]{3}[ ]?[0-9]{2}",
  DO: "[0-9]{5}",
  EC: "([A-Z][0-9]{4}[A-Z]|(?:[A-Z]{2})?[0-9]{6})?",
  EG: "[0-9]{5}",
  EE: "[0-9]{5}",
  FO: "[0-9]{3}",
  GE: "[0-9]{4}",
  GR: "[0-9]{3}[ ]?[0-9]{2}",
  GL: "39[0-9]{2}",
  GT: "[0-9]{5}",
  HT: "[0-9]{4}",
  HN: "(?:[0-9]{5})?",
  HU: "[0-9]{4}",
  IS: "[0-9]{3}",
  IN: "[0-9]{6}",
  ID: "[0-9]{5}",
  IL: "[0-9]{5}",
  JO: "[0-9]{5}",
  KZ: "[0-9]{6}",
  KE: "[0-9]{5}",
  KW: "[0-9]{5}",
  LA: "[0-9]{5}",
  LV: "[0-9]{4}",
  LB: "([0-9]{4}([ ]?[0-9]{4})?)?",
  LI: "(948[5-9])|(949[0-7])",
  LT: "[0-9]{5}",
  LU: "[0-9]{4}",
  MK: "[0-9]{4}",
  MY: "[0-9]{5}",
  MV: "[0-9]{5}",
  MT: "[A-Z]{3}[ ]?[0-9]{2,4}",
  MU: "([0-9]{3}[A-Z]{2}[0-9]{3})?",
  MX: "[0-9]{5}",
  MD: "[0-9]{4}",
  MC: "980[0-9]{2}",
  MA: "[0-9]{5}",
  NP: "[0-9]{5}",
  NZ: "[0-9]{4}",
  NI: "(([0-9]{4}-)?[0-9]{3}-[0-9]{3}(-[0-9]{1})?)?",
  NG: "([0-9]{6})?",
  OM: "(PC )?[0-9]{3}",
  PK: "[0-9]{5}",
  PY: "[0-9]{4}",
  PH: "[0-9]{4}",
  PL: "[0-9]{2}-[0-9]{3}",
  PR: "00[679][0-9]{2}([ -][0-9]{4})?",
  RO: "[0-9]{6}",
  RU: "[0-9]{6}",
  SM: "4789[0-9]",
  SA: "[0-9]{5}",
  SN: "[0-9]{5}",
  SK: "[0-9]{3}[ ]?[0-9]{2}",
  SI: "[0-9]{4}",
  ZA: "[0-9]{4}",
  LK: "[0-9]{5}",
  TJ: "[0-9]{6}",
  TH: "[0-9]{5}",
  TN: "[0-9]{4}",
  TR: "[0-9]{5}",
  TM: "[0-9]{6}",
  UA: "[0-9]{5}",
  UY: "[0-9]{5}",
  UZ: "[0-9]{6}",
  VA: "00120",
  VE: "[0-9]{4}",
  ZM: "[0-9]{5}",
  AS: "96799",
  CC: "6799",
  CK: "[0-9]{4}",
  RS: "[0-9]{6}",
  ME: "8[0-9]{4}",
  CS: "[0-9]{5}",
  YU: "[0-9]{5}",
  CX: "6798",
  ET: "[0-9]{4}",
  FK: "FIQQ 1ZZ",
  NF: "2899",
  FM: "(9694[1-4])([ -][0-9]{4})?",
  GF: "9[78]3[0-9]{2}",
  GN: "[0-9]{3}",
  GP: "9[78][01][0-9]{2}",
  GS: "SIQQ 1ZZ",
  GU: "969[123][0-9]([ -][0-9]{4})?",
  GW: "[0-9]{4}",
  HM: "[0-9]{4}",
  IQ: "[0-9]{5}",
  KG: "[0-9]{6}",
  LR: "[0-9]{4}",
  LS: "[0-9]{3}",
  MG: "[0-9]{3}",
  MH: "969[67][0-9]([ -][0-9]{4})?",
  MN: "[0-9]{6}",
  MP: "9695[012]([ -][0-9]{4})?",
  MQ: "9[78]2[0-9]{2}",
  NC: "988[0-9]{2}",
  NE: "[0-9]{4}",
  VI: "008(([0-4][0-9])|(5[01]))([ -][0-9]{4})?",
  PF: "987[0-9]{2}",
  PG: "[0-9]{3}",
  PM: "9[78]5[0-9]{2}",
  PN: "PCRN 1ZZ",
  PW: "96940",
  RE: "9[78]4[0-9]{2}",
  SH: "(ASCN|STHL) 1ZZ",
  SJ: "[0-9]{4}",
  SO: "[0-9]{5}",
  SZ: "[HLMS][0-9]{3}",
  TC: "TKCA 1ZZ",
  WF: "986[0-9]{2}",
  XK: "[0-9]{5}",
  YT: "976[0-9]{2}"
};

/**
 * Try extracting a valid postal code, if possible
 */
export type Country = keyof typeof POSTAL_CODE_REGEX_PER_COUNTRY;
export function extractPostalCode(
  address: string | null | undefined,
  country: Country = "FR"
) {
  const postalCodeRegex = POSTAL_CODE_REGEX_PER_COUNTRY[country];
  const regex = new RegExp(
    new RegExp(/(^| |,)/).source + // There can be a space, a comma or beginning of string BEFORE
      new RegExp(postalCodeRegex).source + // The postalCode regex
      new RegExp(/($| |,)/).source // There can be a space, a comma or end of string AFTER
  );

  if (address) {
    let formattedAddress = address.replace("\n", " ").toUpperCase();

    // Kind of a complex machine here because matches might overlap and not be
    // detected by RegExp.matches()
    // ex: 134 AV DU GENERAL EISENHOWER CS 42326 31100 TOULOUSE
    // if " 42326 " is detected then " 31100 " won't
    const matches: string[] = [];
    let match: RegExpExecArray | null = null;
    do {
      match = regex.exec(formattedAddress);

      if (match?.length) {
        const cleanedMatch = match[0].replace(/,/g, " ").trim();
        matches.push(cleanedMatch);
        formattedAddress = formattedAddress.replace(cleanedMatch, "");
      }
    } while (match?.length);

    if (matches && matches.length > 0) {
      // In case of multiple matches, return the last one (kind of arbitrary)
      // Some addresses might have misleading numbers that look like postal codes
      // ex: 134 AV DU GENERAL EISENHOWER CS 42326 31100 TOULOUSE
      return matches[matches.length - 1].toUpperCase();
    }
  }
  return "";
}

/**
 * Splits an address into:
 * - street
 * - postal code
 * - city
 * - country (isoCode)
 *
 * Kind of rudimentary though. Everything is "guessed" with raw code
 * instead of making API calls to external mapping services (for performance)
 *
 * If we can't find the postalCode, the fallback is to return the full
 * address in the "street" field
 *
 * If no vatNumber, we assume the address is in France. Else, we use
 * jsvat to find the country.
 */
export const splitAddress = (
  address: string | null | undefined,
  vatNumber?: string | null
) => {
  if (!address) {
    return {
      street: "",
      postalCode: "",
      city: "",
      country: ""
    };
  }

  let country = "FR";
  if (vatNumber) {
    const check = checkVAT(vatNumber, countries);
    country = check.country?.isoCode?.short ?? "";
  }

  const postalCode = extractPostalCode(address, country as Country);

  if (!postalCode) {
    return {
      // Fallback: return the full address in 'street' field
      street: address
        .replace(/\r?\n|\r/g, " ") // remove line breaks
        .replace(/\s+/g, " "), // double spaces to single spaces
      postalCode: "",
      city: "",
      country
    };
  }

  const splitted = address
    .replace(/\r?\n|\r/g, " ") // remove line breaks
    .replace(/\s+/g, " ") // double spaces to single spaces
    .split(postalCode)
    .map(
      s =>
        s
          .replace(/^,/, "") // Remove leading comma
          .trim()
          .replace(/,\s*$/, "") // Remove trailing commas or spaces
    );

  return {
    street: splitted[0],
    postalCode: postalCode,
    city: splitted[1],
    country
  };
};
