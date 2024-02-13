export const extractPrefix = (chunk: string) => {
  const VALID_PREFIXES = ["BSDA", "DASRI", "FF", "VHU", "BSD", "TD", "PAOH"];

  for (const prefix of VALID_PREFIXES) {
    if (chunk.startsWith(prefix)) {
      return { prefix, rest: chunk.replace(prefix, "") };
    }
  }

  throw new Error();
};

export const extractDate = (prefix: string, chunk: string) => {
  let expectedLength = 8;
  let expectedRegex = new RegExp(
    /((19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/
  );

  // Legacy
  if (prefix === "TD") {
    expectedLength = 2;
    expectedRegex = new RegExp(/20|21/);
  }

  if (chunk.length < expectedLength) {
    throw new Error();
  }

  const date = chunk.substring(0, expectedLength);

  if (!expectedRegex.test(date)) {
    throw new Error();
  }

  return { date, rest: chunk.replace(date, "") };
};

export const extractSuffix = (prefix: string, chunk: string) => {
  const isSuite = chunk.endsWith("SUITE");

  chunk = chunk.replace(/suite/gi, "");

  const expectedLength = prefix === "TD" ? 8 : 9;

  if (chunk.length !== expectedLength) {
    throw new Error();
  }

  if (isSuite) return `${chunk}-suite`;
  return chunk;
};

export const toBsdId = (chunk: string) => {
  try {
    // To upper case + remove hyphens
    const sanitized = chunk.replace(/-/g, "").toUpperCase();

    const { prefix, rest } = extractPrefix(sanitized);

    const { date, rest: rest2 } = extractDate(prefix, rest);

    const suffix = extractSuffix(prefix, rest2);

    return `${prefix}-${date}-${suffix}`;
  } catch (e) {
    throw new Error(`"${chunk}" n'est pas un identifiant de bordereau valide`);
  }
};

export const splitIntoBsdIds = (blob: string) => {
  // Remove comas, quotes & single quotes
  blob = blob.replace(/,/g, " ").replace(/"/g, "").replace(/'/g, "");

  // Convert all kinds of spaces to one space only
  blob = blob
    .replace(/[\n\r]/g, " ")
    .replace(/\s\s+/g, " ")
    .trim();

  // Split into chunks
  const chunks = blob.split(" ").filter(Boolean);

  // Convert chunks into actual BSD ids
  const ids = chunks.map(toBsdId);

  // Remove duplicates
  return [...new Set(ids)];
};
