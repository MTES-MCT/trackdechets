/*
 *
 * remove a top level or nested key from an object
 */
export const omitDeep = (obj, toOmit) => {
  if (obj !== Object(obj)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => omitDeep(item, toOmit));
  }

  return Object.keys(obj)

    .filter(k => !toOmit.includes(k))
    .reduce(
      (acc, x) => Object.assign(acc, { [x]: omitDeep(obj[x], toOmit) }),
      {}
    );
};

export const keepDeep = (obj, toOmit) => {
  if (obj !== Object(obj)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keepDeep(item, toOmit));
  }

  return Object.keys(obj)

    .filter(k => toOmit.includes(k))
    .reduce(
      (acc, x) => Object.assign(acc, { [x]: keepDeep(obj[x], toOmit) }),
      {}
    );
};
