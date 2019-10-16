/**
 * Remove whitespace from a given siret
 * @param s string
 */
export const trimSiret = (s:string):string => (s.replace(/\s+/g, ""));
