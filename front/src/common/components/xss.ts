const entities = { "&gt;": "\u003E", "&lt;": "\u003C" };

/**
 *
 * Allow to properly display xss filtered chars (cirrently < and > )without using back or front hazardous methods
 *
 */
export const entitiesToEscapedUnicode = (
  escapedString: string | undefined | null
): string => {
  if (escapedString === undefined || escapedString === null) {
    return "";
  }
  let escapedUnicode = escapedString;
  Object.keys(entities).map(
    key =>
      (escapedUnicode = escapedUnicode.replace(new RegExp(key), entities[key]))
  );
  return escapedUnicode;
};
