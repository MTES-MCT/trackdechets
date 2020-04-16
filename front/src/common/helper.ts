import { DocumentNode } from "graphql";
import { DataProxy } from "apollo-cache";
import { ApolloError } from "apollo-client";

export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * converts `aString` to `A_STRING`
 * @param string
 */
export function toMacroCase(string: string) {
  return string
    .split("")
    .map((c) => (c.toUpperCase() === c ? `_${c.trim()}` : c))
    .join("")
    .replace(/_+/g, "_")
    .toUpperCase();
}

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

    store.writeQuery({
      query,
      variables,
      data: { ...existingData, ...newData },
    });
  } catch (_) {
    console.info(`Cache miss, skipping update.`);
  }
}

export function getErrorMessages(err: ApolloError) {
  return err.graphQLErrors.map((error) => error.message);
}

export function removeNulls(obj) {
  const isArray = obj instanceof Array;
  for (const k in obj) {
    if (obj[k] === null) isArray ? obj.splice(k, 1) : delete obj[k];
    else if (typeof obj[k] == "object") removeNulls(obj[k]);
  }

  return obj;
}

/**
 * Format a date to yyyy-MM-dd
 * This format should be used for input of type "date"
 * @param date
 */
export function formatDate(date: Date) {
  // Cf https://stackoverflow.com/questions/3605214/javascript-add-leading-zeroes-to-date
  const yyyy = date.getFullYear();
  const mm = ("0" + (date.getMonth() + 1)).slice(-2);
  const dd = ("0" + date.getDate()).slice(-2);
  return `${yyyy}-${mm}-${dd}`;
}
