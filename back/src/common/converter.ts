/**
 * Return null if all object values are null
 * obj otherwise
 */
export function nullIfNoValues<T>(obj: T): T | null {
  return Object.values(obj).some(v => v !== null && v !== "") ? obj : null;
}

/**
 * Discard undefined fields in a flatten input
 * It is used to prevent overriding existing data when
 * updating records
 */
export function safeInput<K>(obj: K): Partial<K> {
  return Object.keys(obj).reduce((acc, curr) => {
    return {
      ...acc,
      ...(obj[curr] !== undefined ? { [curr]: obj[curr] } : {})
    };
  }, {});
}

/**
 * Removes keys that are either null or an empty array from an object
 */
export function removeEmpty<T>(obj: T): Partial<T> {
  const cleanedObject = Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v != null && (Array.isArray(v) ? v.length > 0 : true)
    )
  );

  return Object.keys(cleanedObject).length === 0
    ? null
    : (cleanedObject as Partial<T>);
}

/**
 * Equivalent to a typescript optional chaining operator foo?.bar
 * except that it returns "null" instead of "undefined" if "null" is encountered in the chain
 * It allows to differentiate between voluntary null update and field omission that should
 * not update any data
 */
export function chain<T, K>(o: T, getter: (o: T) => K): K | null | undefined {
  if (o === null) {
    return null;
  }
  if (o === undefined) {
    return undefined;
  }
  return getter(o);
}

export function undefinedOrDefault<I>(value: I, defaultValue: I): I {
  if (value === null) {
    return defaultValue;
  }

  return value;
}
type MaybeDateParam = Date | string | undefined | null;
/**
 *
 * @param maybeDate date, string or null/undefined
 * @returns
 */
export const processDate = (maybeDate: MaybeDateParam): Date | null => {
  if (!maybeDate) return null;
  return maybeDate instanceof Date ? maybeDate : new Date(maybeDate);
};
