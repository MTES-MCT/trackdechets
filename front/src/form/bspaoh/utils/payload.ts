/**
 *
 * Shamelessly copypasted from SO, this helper
 *  * remove empty nested object from a payload
 */
export const cleanPayload = object => {
  Object.entries(object).forEach(([k, v]) => {
    if (v && typeof v === "object") {
      cleanPayload(v);
    }
    if (
      (v && typeof v === "object" && !Object.keys(v).length) ||
      v === null ||
      v === undefined
    ) {
      if (Array.isArray(object)) {
        if (Number.isInteger(k)) {
          object.splice(parseInt(k, 10), 1);
        }
      } else {
        delete object[k];
      }
    }
  });
  return object;
};
