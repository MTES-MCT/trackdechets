/**
 * Remove whitespace from a given string
 * @param s string
 */
export const trim = (s: string): string => s.replace(/\s+/g, "");

export const capitalize = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);
