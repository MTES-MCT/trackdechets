import { DocumentNode } from "graphql";
import { ApolloError, DataProxy } from "@apollo/client";
import { getCountries, isValidPhoneNumber } from "libphonenumber-js";

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

export function updateApolloCache<T>(
  store: DataProxy,
  {
    query,
    getNewData,
    variables = {},
  }: { query: DocumentNode; getNewData: (d: T) => T; variables: any }
) {
  try {
    const existingData = store.readQuery<T>({
      query,
      variables,
    });

    if (!existingData) {
      return null;
    }

    const newData = getNewData(existingData);

    store.writeQuery<T>({
      query,
      variables,
      data: { ...existingData, ...newData },
    });
  } catch (_) {
    console.info(`Cache miss, skipping update.`);
  }
}

export function getErrorMessages(err: ApolloError) {
  return err.graphQLErrors.map(error => error.message);
}

function isObject(value: any): boolean {
  return Object.prototype.toString.call(value) === "[object Object]";
}

/**
 * Merge options into defaults without extending that object.
 *
 * @example
 * mergeDefaults({ foo: "" }, { foo: "foo", bar: "bar" })
 * // returns { foo: "foo" }
 *
 * @param {Object} defaults The shape of the final object, with all default values.
 * @param {Object} options Values that should overwrite defaults'.
 *
 * @returns {Object} Object with the exact shape as defaults, with values from options where provided.
 */
export function mergeDefaults<T>(defaults: T, options: Record<string, any>): T {
  return Object.keys(defaults as any).reduce((acc, key) => {
    if (options[key] == null) {
      return {
        ...acc,
      };
    }

    return {
      ...acc,
      [key]: isObject(acc[key])
        ? mergeDefaults(acc[key], options[key])
        : options[key],
    };
  }, defaults);
}

const traverse = ({ obj, paths, depth = 0 }) => {
  const node = obj[paths[depth]];

  if (depth === paths.length - 1) {
    return node;
  } else {
    return traverse({ obj: node, paths, depth: depth + 1 });
  }
};

/**
 *   Retrieve an object node via its dotted path
 *  eg: getNestedValue(form, "emitter.emission.waste.weight")
 */
export const getNestedNode = (obj: Object, path: String): any => {
  const paths = path.split(".");
  try {
    return traverse({ obj, paths });
  } catch (e) {
    return null;
  }
};

/**
 * Clean an object from null, undefined, empty string and empty objects values
 * @param obj Input object
 * @returns A cleaned object
 */
export function removeEmptyKeys<T>(obj: Object): Partial<T> | undefined {
  function isValid(value) {
    return (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      (Array.isArray(value) ? value.length > 0 : true)
    );
  }

  const newObject = Object.entries(obj)
    .filter(([, value]) => isValid(value))
    .reduce((cleanedObj, [key]) => {
      const value =
        typeof obj[key] === "object"
          ? Array.isArray(obj[key])
            ? obj[key]
            : removeEmptyKeys(obj[key])
          : obj[key];

      if (isValid(value)) cleanedObj[key] = value;
      return cleanedObj;
    }, {});

  return Object.keys(newObject).length !== 0 ? newObject : undefined;
}

export const decodeHash = (hash: string | string[] | null): string => {
  if (!hash) {
    return "";
  }
  return Array.isArray(hash)
    ? decodeURIComponent(hash[0])
    : decodeURIComponent(hash);
};

export const sortCompaniesByName = values => {
  return [...values].sort((a, b) => {
    const aName = a.givenName || a.name || "";
    const bName = b.givenName || b.name || "";
    return aName.localeCompare(bName);
  });
};

const countries = getCountries().map(country => country);

export const validatePhoneNumber = value =>
  !!value &&
  ((!value.startsWith("0") &&
    value.startsWith("+") &&
    countries.some(country => isValidPhoneNumber(value!, country))) ||
    (value.startsWith("0") && /^(0[1-9])(?:[ _.-]?(\d{2})){4}$/.test(value)));

export const debounce = <F extends (...args: any) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: number = 0;

  const debounced = (...args: any) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};