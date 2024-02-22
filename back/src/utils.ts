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

/**
 * Return a unique identifier with the given `len`.
 *
 * @param {Number} length
 * @return {String}
 */
export function genCaptchaString(len: number): string {
  let captcha = "";
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ123456789"; // exclude I, 0 and O
  const charsLength = chars.length;

  for (let i = 0; i < len; ++i) {
    captcha += chars[crypto.randomInt(0, charsLength - 1)];
  }
  return captcha;
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

/**
 * Compute a past date relative to baseDate
 *
 * @param baseDate Date
 * @param daysAgo Integer
 * @return a date at 00:00:00
 */
export const xDaysAgo = (baseDate: Date, daysAgo: number): Date => {
  const clonedDate = new Date(baseDate.getTime()); // avoid mutating baseDate
  clonedDate.setDate(clonedDate.getDate() - daysAgo);

  return new Date(clonedDate.toDateString());
};

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
export function extractPostalCode(address: string | null | undefined) {
  if (address) {
    const matches = address.match(/([0-9]{5})/);
    if (matches && matches.length > 0) {
      return matches[0];
    }
  }
  return "";
}

const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
const reHasRegExpChar = RegExp(reRegExpChar.source);

/**
 * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
 * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
 *
 * TAKEN FROM https://github.com/lodash/lodash/blob/master/escapeRegExp.js
 *
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to escape.
 * @returns {string} Returns the escaped string.
 * @see escape, escapeRegExp, unescape
 * @example
 *
 * escapeRegExp('[lodash](https://lodash.com/)')
 * // => '\[lodash\]\(https://lodash\.com/\)'
 */
export function escapeRegExp(string) {
  return string && reHasRegExpChar.test(string)
    ? string.replace(reRegExpChar, "\\$&")
    : string || "";
}

const ALGO = "aes-256-gcm";
// symetric encription
const ENCRYPTION_KEY = process.env.WEBHOOK_TOKEN_ENCRYPTION_KEY;
const IV_LENGTH = 12;

export const aesEncrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, ENCRYPTION_KEY!, iv);

  const enc1 = cipher.update(text, "utf8");
  const enc2 = cipher.final();
  return Buffer.concat([enc1, enc2, iv, cipher.getAuthTag()]).toString(
    "base64"
  );
};

export const aesDecrypt = encrypted => {
  encrypted = Buffer.from(encrypted, "base64");
  const length = encrypted.length;
  const iv = encrypted.slice(length - 28, length - 16);
  const tag = encrypted.slice(length - 16);
  const content = encrypted.slice(0, length - 28);
  const decipher = crypto.createDecipheriv(ALGO, ENCRYPTION_KEY!, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(content, undefined, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

/**
 * Generates a random chain of numbers, like "012082"
 */
export const randomNbrChain = (length: number) => {
  return "0"
    .repeat(length)
    .split("")
    .map(_ => Math.floor(Math.random() * 10))
    .join("");
};
