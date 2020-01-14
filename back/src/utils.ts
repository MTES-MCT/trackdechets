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
  const { NODE_ENV, UI_HOST } = process.env;
  const scheme = NODE_ENV === "dev" ? "http" : "https";
  return `${scheme}://${UI_HOST}`;
}
