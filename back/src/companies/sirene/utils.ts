import { libellesCodesNaf } from "./fixtures/libellesCodesNaf";

/** */
export function libelleFromCodeNaf(codeNaf: string) {
  const formattedNaf = codeNaf.replace(/[.-]/g, "");
  const libelle = libellesCodesNaf[formattedNaf];
  return libelle || "";
}

/**
 * Build a full address string from its base components
 */
export function buildAddress(addressComponents: string[]) {
  return addressComponents.filter(x => !!x).join(" ");
}

export function safeParseFloat(f: string) {
  return f ? parseFloat(f) : null;
}

/**
 * Remove diacritics (accents) from a string
 * Cf https://stackoverflow.com/questions/990904/
 * remove-accents-diacritics-in-a-string-in-javascript
 */
export function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
