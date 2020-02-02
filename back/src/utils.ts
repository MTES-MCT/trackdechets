export function randomNumber(length: number = 4) {
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
    uid += chars[getRandomInt(0, charsLength - 1)];
  }
  return uid;
}

/**
 * Return a random int, used by `utils.getUid()`.
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Merge a list of graphql-shield permissions
 * @param permissions
 */
export function mergePermissions(permissions) {
  const merge = (r1, r2) => {
    return {
      Query: { ...r1.Query, ...r2.Query },
      Mutation: { ...r1.Mutation, ...r2.Mutation }
    };
  };

  return permissions.reduce((prev, cur) => merge(prev, cur));
}

export function getUIBaseURL() {
  let { UI_URL_SCHEME, UI_HOST } = process.env;
  UI_URL_SCHEME = UI_URL_SCHEME || "http";
  return `${UI_URL_SCHEME}://${UI_HOST}`;
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
