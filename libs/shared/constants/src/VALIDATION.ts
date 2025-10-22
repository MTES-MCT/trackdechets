export const SSTI_CHARS = ["{", "}", "%", "<", ">", "$", `"`, "="]; // single quote removed

export function isValidWebsite(s: string): boolean {
  try {
    const url = new URL(s);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

export const MIN_DATE_FOR_REGISTRY = {
  years: 1,
  months: 6
};
