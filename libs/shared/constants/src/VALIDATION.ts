export const SSTI_CHARS = ["{", "}", "%", "<", ">", "$", "'", `"`, "="];

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
