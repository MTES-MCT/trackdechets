import { format } from "date-fns";
import { base32Encode } from "../utils";
export enum ReadableIdPrefix {
  BSD = "BSD", // Bordereau de suivi des déchets dangereux "générique" (CERFA n° 12571*01)
  DASRI = "DASRI", // Bordereau de suivi des déchets d'activités de soins à risque infectieux
  FF = "FF", // Bordereau de suivi de déchets fluides frigorigènes
  VHU = "VHU", // Bordereau de suivi des véhicules hors d'usage
  BSDA = "BSDA", // Bordereau de suivi des déchets d'amiante
  PAOH = "PAOH" // Bordereau de suivi des déchets d'amiante
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
