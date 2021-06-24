import crypto from "crypto";

export function randomNumber(length = 4) {
  const basis = Math.pow(10, length - 1);
  return Math.floor(basis + Math.random() * 9 * basis);
}

/**
 * Return a unique identifier with the given `len`.
 *
 * @param {Number} length
 * @return {String}
 */
export function getUid(len: number): string {
  let uid = "";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charsLength = chars.length;

  for (let i = 0; i < len; ++i) {
    uid += chars[crypto.randomInt(0, charsLength - 1)];
  }
  return uid;
}

export function getUIBaseURL() {
  const { UI_URL_SCHEME, UI_HOST } = process.env;
  return `${UI_URL_SCHEME || "http"}://${UI_HOST}`;
}

export function getAPIBaseURL() {
  const { API_URL_SCHEME, API_HOST } = process.env;
  return `${API_URL_SCHEME || "http"}://${API_HOST}`;
}

/**
 * Convert a date to midnight the same day
 * @param date
 */
export function sameDayMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Number of days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const millis1 = date1.getTime();
  const millis2 = date2.getTime();
  const dayMillis = 24 * 3600 * 1000; // number of milliseconds in one day
  const numberOfdays = Math.trunc((millis1 - millis2) / dayMillis);
  return numberOfdays;
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
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

/**
 * hash a given token with sha256 alg before storing or retrieving it
 */
export const hashToken = (token: string) =>
  crypto
    .createHmac("sha256", process.env.API_TOKEN_SECRET)
    .update(token)
    .digest("hex");

/**
 *Try extracting a valid postal code
 */
export function extractPostalCode(address: string) {
  if (address) {
    const matches = address.match(/([0-9]{5})/);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }
  return "";
}
