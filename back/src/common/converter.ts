/**
 * Return null if all object values are null
 * obj otherwise
 */
export function nullIfNoValues<T extends Record<string, unknown>>(obj: {
  [P in keyof T]?: T[P] | null; // Allow null values on the input, even if forbidden by gql
}): T | null {
  return Object.values(obj).some(v => v !== null && v !== "")
    ? (obj as T)
    : null;
}

/**
 * Discard undefined fields in a flatten input
 * It is used to prevent overriding existing data when
 * updating records
 */
export function safeInput<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.keys(obj).reduce((acc, curr) => {
    return {
      ...acc,
      ...(obj[curr] !== undefined ? { [curr]: obj[curr] } : {})
    };
  }, {} as any);
}

/**
 * Removes keys that are either null or an empty array from an object
 */
export function removeEmpty<T extends Record<string, unknown>>(
  obj: T
): { [K in keyof T]-?: NonNullable<T[K]> } | null {
  const cleanedObject: any = Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v != null && (Array.isArray(v) ? v.length > 0 : true)
    )
  );

  return Object.keys(cleanedObject).length === 0 ? null : cleanedObject;
}

/**
 * Equivalent to a typescript optional chaining operator foo?.bar
 * except that it returns "null" instead of "undefined" if "null" is encountered in the chain
 * It allows to differentiate between voluntary null update and field omission that should
 * not update any data
 */
export function chain<T, K>(
  o: T,
  getter: (o: NonNullable<T>) => K
): K | null | undefined {
  if (o === null) {
    return null;
  }
  if (o === undefined) {
    return undefined;
  }
  return getter(o as NonNullable<T>); // TODO remove "as" when strictNullCheck is turned on
}

export function undefinedOrDefault<I>(value: I, defaultValue: NonNullable<I>) {
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
export function processDate(maybeDate: string | Date): Date;
export function processDate(maybeDate: MaybeDateParam): Date | null;
export function processDate(maybeDate: MaybeDateParam): Date | null {
  if (!maybeDate) return null;
  return maybeDate instanceof Date ? maybeDate : new Date(maybeDate);
}
