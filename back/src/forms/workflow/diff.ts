import { isDate, isEqual } from "date-fns";
import { BsddTransporter, Form } from "@prisma/client";
import { expandFormFromDb } from "../converter";

export function isArray(obj) {
  return {}.toString.apply(obj) === "[object Array]";
}

export function isObject(obj) {
  return {}.toString.apply(obj) === "[object Object]";
}

export function isString(obj) {
  return {}.toString.call(obj) === "[object String]";
}

export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

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
    if (isString(o2[key]) || isString(o1[key])) {
      if (stringEqual(o1[key], o2[key])) {
        return diff;
      }
      return {
        ...diff,
        [key]: o2[key]
      };
    }
    if (o1[key] === o2[key] || !(key in o1)) return diff;
    return {
      ...diff,
      [key]: o2[key]
    };
  }, {});
}

export async function tempStorageDiff(
  t1: Form | null | undefined,
  t2: Form | null | undefined
) {
  if (!t1 && !t2) {
    return {};
  }

  if (!t1 && t2) {
    return { temporaryStorageDetail: await expandFormFromDb(t2) };
  }

  if (t1 && !t2) {
    return { temporaryStorageDetail: null };
  }
  const {
    updatedAt: _u1,
    status: _s1,
    ...expandedt1
  } = await expandFormFromDb(t1 as any);
  const {
    updatedAt: _u2,
    status: _s2,
    ...expandedt2
  } = await expandFormFromDb(t2 as any);

  const diff = objectDiff(expandedt1, expandedt2);

  return isEmpty(diff) ? {} : { temporaryStorageDetail: diff };
}

type FormWithTransporters = Form & { transporters: BsddTransporter[] | null };

/**
 * Calculates expanded diff between two forms
 */
export async function formDiff(
  f1: FormWithTransporters & {
    forwardedIn?: FormWithTransporters | null;
  },
  f2: Form & { forwardedIn?: Form | null }
) {
  const {
    updatedAt: _u1,
    status: _s1,
    ...expandedf1
  } = await expandFormFromDb(f1);
  const {
    updatedAt: _u2,
    status: _s2,
    ...expandedf2
  } = await expandFormFromDb(f2);

  return {
    ...objectDiff(expandedf1, expandedf2),
    ...(await tempStorageDiff(f1.forwardedIn, f2.forwardedIn))
  };
}
