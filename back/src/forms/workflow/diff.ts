import { isDate, isEqual } from "date-fns";
import { Form, TemporaryStorageDetail } from "@prisma/client";
import {
  expandFormFromDb,
  expandTemporaryStorageFromDb
} from "../form-converter";

export function isArray(obj) {
  return {}.toString.apply(obj) === "[object Array]";
}

export function isObject(obj) {
  return {}.toString.apply(obj) === "[object Object]";
}

export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (isObject(a[i])) {
      const diff = objectDiff(a[i], b[i]);
      if (Object.keys(diff).length > 0) return false;
    } else if (a[i] !== b[i]) return false;
  }
  return true;
}

export function objectDiff(o1, o2) {
  return Object.keys(o2).reduce((diff, key) => {
    if (isObject(o2[key])) {
      const innerDiff = objectDiff(o1[key] ?? {}, o2[key]);
      return {
        ...diff,
        ...(isEmpty(innerDiff) ? {} : { [key]: innerDiff })
      };
    }
    if (isArray(o2[key])) {
      if (arraysEqual(o1[key], o2[key])) {
        return diff;
      }
      return {
        ...diff,
        [key]: o2[key]
      };
    }
    if (isDate(o2[key])) {
      if (o1[key] && isEqual(o2[key], o1[key])) {
        return diff;
      }
      return {
        ...diff,
        [key]: o2[key]
      };
    }
    if (o1[key] === o2[key]) return diff;
    return {
      ...diff,
      [key]: o2[key]
    };
  }, {});
}

export function tempStorageDiff(
  t1: TemporaryStorageDetail,
  t2: TemporaryStorageDetail
) {
  if (!t1 && !t2) {
    return {};
  }

  if (!t1 && t2) {
    return { temporaryStorageDetail: expandTemporaryStorageFromDb(t2) };
  }

  if (t1 && !t2) {
    return { temporaryStorageDetail: null };
  }

  const diff = objectDiff(
    expandTemporaryStorageFromDb(t1),
    expandTemporaryStorageFromDb(t2)
  );

  return isEmpty(diff) ? {} : { temporaryStorageDetail: diff };
}

/**
 * Calculates expanded diff between two forms
 */
export function formDiff(
  f1: Form & { temporaryStorageDetail?: TemporaryStorageDetail },
  f2: Form & { temporaryStorageDetail?: TemporaryStorageDetail }
) {
  const { updatedAt: _u1, status: _s1, ...expandedf1 } = expandFormFromDb(f1);
  const { updatedAt: _u2, status: _s2, ...expandedf2 } = expandFormFromDb(f2);

  return {
    ...objectDiff(expandedf1, expandedf2),
    ...tempStorageDiff(f1.temporaryStorageDetail, f2.temporaryStorageDetail)
  };
}
