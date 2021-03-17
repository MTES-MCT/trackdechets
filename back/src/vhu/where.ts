import { Prisma } from "@prisma/client";
import { isObject } from "../forms/workflow/diff";
import { BsvhuWhere } from "../generated/graphql/types";

const comparatorKeys = ["_gte", "_gt", "_lte", "_lt"];

export function convertWhereToDbFilter(where: BsvhuWhere) {
  if (!where) {
    return {};
  }

  const { _or, _and, _not, ...filters } = where;

  const hasOrNesting = _or?.some(w => w._or || w._and || w._not);
  const hasAndNesting = _and?.some(w => w._or || w._and || w._not);
  const hasNotNesting = _not?.some(w => w._or || w._and || w._not);

  if (hasOrNesting || hasAndNesting || hasNotNesting) {
    throw new Error("Cannot nest conditions deeper than one level"); // TODO proper typed error
  }

  return {
    OR: _or?.map(w => getDbFilter(w)),
    AND: _and?.map(w => getDbFilter(w)),
    NOT: _not?.map(w => getDbFilter(w)),
    ...getDbFilter(filters)
  };
}

function getDbFilter(where: BsvhuWhere) {
  const filters = recursiveGetDbFilters(where);

  return filters.reduce((dbFilters, { key, value, operator }) => {
    if (operator) {
      dbFilters[key] = dbFilters[key] ?? {};
      dbFilters[key][operator] = value;
      return dbFilters;
    }

    dbFilters[key] = value;
    return dbFilters;
  }, {} as Prisma.VhuFormWhereInput);
}

function recursiveGetDbFilters(
  where: BsvhuWhere | unknown,
  prevKeys: string[] = []
): { key: string; value: string; operator?: string }[] {
  return Object.keys(where)
    .map(key => {
      const keysList = [...prevKeys, key];
      if (isObject(where[key])) {
        return recursiveGetDbFilters(where[key], keysList);
      }

      const isComparaisonKey = comparatorKeys.includes(key);
      const dbKey = getNestedKey(
        filterMapping,
        isComparaisonKey ? prevKeys : keysList
      );
      return dbKey
        ? {
            key: dbKey,
            value: where[key],
            operator: isComparaisonKey ? key.substring(1) : undefined
          }
        : null;
    })
    .flat()
    .filter(Boolean);
}

const filterMapping: {
  [key in keyof BsvhuWhere]: BsvhuWhere[key] | string;
} = {
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  emitter: { company: { siret: "emitterCompanySiret" } },
  isDraft: "isDraft",
  recipient: { company: { siret: "recipientCompanySiret" } },
  status: "status",
  transporter: { company: { siret: "transporterCompanySiret" } }
};

function getNestedKey(obj: any, keys: string[]) {
  return keys.reduce((prev, cur) => prev?.[cur], obj);
}
