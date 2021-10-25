import { DocumentNode } from "graphql";
import { ApolloError, DataProxy } from "@apollo/client";

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
  return Object.keys(defaults).reduce((acc, key) => {
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

  return traverse({ obj, paths });
};
