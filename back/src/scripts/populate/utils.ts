import { format } from "date-fns";
import { base32Encode } from "../../utils";
import { getRandomInt } from "../../forms/readableId";
export enum ReadableIdPrefix {
  BSD = "BSD", // Bordereau de suivi des déchets dangereux "générique" (CERFA n° 12571*01)
  DASRI = "DASRI", // Bordereau de suivi des déchets d'activités de soins à risque infectieux
  FF = "FF", // Bordereau de suivi de déchets fluides frigorigènes
  VHU = "VHU", // Bordereau de suivi des véhicules hors d'usage
  BSDA = "BSDA" // Bordereau de suivi des déchets d'amiante
}

export const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];

export function getReadableId(date, prefix) {
  const todayStr = format(date, "yyyyMMdd");
  const charsLength = 9;
  const max = Math.pow(32, charsLength) - 1; // "ZZZZZZZZZ" in base 32, ~3*10^13
  const randomNumber = getRandomInt(max);
  // convert number to base32 string padded with `0`
  const encoded = base32Encode(randomNumber).padStart(charsLength, "0");
  return `${prefix}-${todayStr}-${encoded}`;
}

export function populateSiretify(index) {
  const siretLength = 14;
  const siret = `${index}`;
  if (siret.length === siretLength) {
    return siret;
  }
  if (siret.length > siretLength) {
    throw Error("Generated siret is too long");
  }
  return siret.padStart(14, "0"); // pad with 0 rather than 1 in siretify
}

export const chunkArray = (array, chunkSize) =>
  Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, index) =>
    array.slice(index * chunkSize, (index + 1) * chunkSize)
  );
