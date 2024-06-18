import { isDate, isEqual } from "date-fns";
import {
  PrismaFormWithForwardedInAndTransporters,
  expandFormFromDb
} from "../converter";
import Decimal from "decimal.js";
import {
  isObject,
  isArray,
  isEmpty,
  isNumber,
  isString
} from "../../common/dataTypes";

export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  const sortedA = [...a]
    .map(item => (isObject(item) ? { ...item } : item))
    .sort();
  const sortedB = [...b]
    .map(item => (isObject(item) ? { ...item } : item))
    .sort();

  for (let i = 0; i < sortedA.length; ++i) {
    if (isObject(sortedA[i])) {
      const diff = objectDiff(sortedA[i], sortedB[i]);
      if (Object.keys(diff).length > 0) return false;
    } else if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

export function stringEqual(
  s1: string | null | undefined,
  s2: string | null | undefined
) {
  return (s1 ?? "") === (s2 ?? "");
}

export function numberEqual(
  n1: number | Decimal | null | undefined,
  n2: number | Decimal | null | undefined
) {
  if (n1 && n2) {
    // Because of decimal issues in the DB, we round up
    return new Decimal(n1)
      .toDecimalPlaces(6)
      .equals(new Decimal(n2).toDecimalPlaces(6));
  }
  return n1 === n2;
}

/**
 * Calculates the diff between 2 objects, and returns the differences.
 *
 * @param baseObject
 * @param updatedObject
 * @returns subset of updatedObject that differs from baseObject
 */
export function objectDiff(baseObject, updatedObject) {
  return Object.keys(updatedObject).reduce((diff, key) => {
    if (isObject(updatedObject[key])) {
      const innerDiff = objectDiff(baseObject[key] ?? {}, updatedObject[key]);
      return {
        ...diff,
        ...(isEmpty(innerDiff) ? {} : { [key]: innerDiff })
      };
    }
    if (isArray(updatedObject[key])) {
      if (arraysEqual(baseObject[key], updatedObject[key])) {
        return diff;
      }
      return {
        ...diff,
        [key]: updatedObject[key]
      };
    }
    if (isDate(updatedObject[key])) {
      if (baseObject[key] && isEqual(updatedObject[key], baseObject[key])) {
        return diff;
      }
      return {
        ...diff,
        [key]: updatedObject[key]
      };
    }
    if (isString(updatedObject[key]) || isString(baseObject[key])) {
      if (stringEqual(baseObject[key], updatedObject[key])) {
        return diff;
      }
      return {
        ...diff,
        [key]: updatedObject[key]
      };
    }

    if (isNumber(updatedObject[key])) {
      if (numberEqual(baseObject[key], updatedObject[key])) {
        return diff;
      }
      return { ...diff, [key]: updatedObject[key] };
    }

    if (baseObject[key] === updatedObject[key] || !(key in baseObject))
      return diff;
    return {
      ...diff,
      [key]: updatedObject[key]
    };
  }, {});
}

function tempStorageDiff(
  t1: PrismaFormWithForwardedInAndTransporters,
  t2: PrismaFormWithForwardedInAndTransporters
) {
  if (!t1 && !t2) {
    return {};
  }

  if (!t1 && t2) {
    return { temporaryStorageDetail: expandFormFromDb(t2) };
  }

  if (t1 && !t2) {
    return { temporaryStorageDetail: null };
  }
  const {
    updatedAt: _u1,
    status: _s1,
    // there is only one transporter on forwardedIn form so we
    // can exclude the list of transporters and compute the diff on
    // the first transporter only (field `transporter`).
    transporters: _ts1,
    ...expandedt1
  } = expandFormFromDb(t1!);
  const {
    updatedAt: _u2,
    status: _s2,
    transporters: _ts2,
    ...expandedt2
  } = expandFormFromDb(t2!);

  const diff = objectDiff(expandedt1, expandedt2);

  return isEmpty(diff) ? {} : { temporaryStorageDetail: diff };
}

/**
 * Calculates expanded diff between two forms
 *
 * FIXME - Diff on array of transporters does not work well for time being so we
 * exclude this field from the diff comparison. The diff will only be computed
 * on the first transporter
 */
export function formDiff(
  f1: PrismaFormWithForwardedInAndTransporters,
  f2: PrismaFormWithForwardedInAndTransporters
) {
  const {
    updatedAt: _u1,
    status: _s1,
    transporters: _ts1,
    ...expandedf1
  } = expandFormFromDb(f1);
  const {
    updatedAt: _u2,
    status: _s2,
    transporters: _ts2,
    ...expandedf2
  } = expandFormFromDb(f2);

  return {
    ...objectDiff(expandedf1, expandedf2),
    ...tempStorageDiff(
      f1.forwardedIn as PrismaFormWithForwardedInAndTransporters,
      f2.forwardedIn as PrismaFormWithForwardedInAndTransporters
    )
  };
}
