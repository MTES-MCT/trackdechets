/**
 * Formats a date like "8 juillet 2024 à 17:49"
 */
export const dateToXMonthAtHHMM = (date: Date = new Date()): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  };

  return date.toLocaleDateString("fr-FR", options);
};

/**
 * Tests if an object is defined. 0 will be considered as defined.
 */
export const isDefined = (obj: any) => {
  return obj !== null && obj !== undefined;
};

/**
 * This one does not consider empty strings "" as 'defined'
 */
export const isDefinedStrict = (val: any): boolean => {
  if (val === "") return false;

  return isDefined(val);
};

/*
 * Tests if a list of objects are ALL defined. 0 will be considered as defined
 */
export const areDefined = (...obj: any[]) => {
  if (obj.some(o => !isDefined(o))) return false;
  return true;
};

export function getSafeReturnTo(returnTo: string, base: string) {
  try {
    const url = new URL(`${base}${returnTo}`);
    if (url.origin === new URL(base).origin) {
      return returnTo;
    }
    return "/";
  } catch (_) {
    return "/";
  }
}
