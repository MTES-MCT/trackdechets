import { format } from "date-fns";

export enum ReadableIdPrefix {
  BSD = "BSD", // Bordereau de suivi des déchets dangereux "générique" (CERFA n° 12571*01)
  DASRI = "DASRI", // Bordereau de suivi des déchets d'activités de soins à risque infectieux
  HFC = "HFC", // Bordereau de suivi de déchets fluides frigorigènes
  VHU = "VHU" // Bordereau de suivi des véhicules hors d'usage
}

/**
 * Returns a new readable id
 * Format {prefix}-YYYYMMdd-{XXXXXXXXX} where XXXXXXXXX
 * is a random sequence of 9 alphanumeric characters
 *
 * According to https://fr.wikipedia.org/wiki/Paradoxe_des_anniversaires,
 * the probability that at least two ID's generated the same day collides is equal
 * to p(n) = 1 - (N!/(N-n!) * (1 / N^n)
 * where n is the number of BSD generated each day and N = 32^9
 *
 * Assuming 18*10^6 BSD's will be created each year, we have n =~ 50000
 * and p = 0,0036%, meaning one collision every 77 years in average wich
 * is acceptable
 *
 * @param prefix
 */
export default function getReadableId(prefix = ReadableIdPrefix.BSD) {
  const now = new Date();
  const todayStr = format(now, "yyyyMMdd");
  const charsLength = 9;
  const max = Math.pow(32, charsLength) - 1; // "ZZZZZZZZZ" in base 32, ~3*10^13
  const randomNumber = getRandomInt(max);
  // convert number to base32 string padded with `0`
  const encoded = base32Encode(randomNumber).padStart(charsLength, "0");
  return `${prefix}-${todayStr}-${encoded}`;
}

/**
 * Returns a random number in the interval [0, max]
 */
export function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

/**
 * base32-crockford
 * ================
 * Implement the alternate base32 encoding as described
 * by Douglas Crockford at: http://www.crockford.com/wrmg/base32.html.
 * He designed the encoding to:
 *   * Be human and machine readable
 *   * Be compact
 *   * Be error resistant
 *   * Be pronounceable
 * It uses a symbol set of 10 digits and 22 letters, excluding I, L O and U.
 */
export function base32Encode(n: number): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".split("");
  function encode(n: number, encoded = "") {
    if (n > 0) {
      const r = n % 32;
      const q = (n - r) / 32;
      const symbol = alphabet[r];
      return encode(q, symbol + encoded);
    }
    return encoded;
  }
  if (n === 0) {
    return "0";
  } else {
    return encode(n);
  }
}
