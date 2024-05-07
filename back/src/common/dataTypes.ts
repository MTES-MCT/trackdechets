export function isArray(obj) {
  return {}.toString.apply(obj) === "[object Array]";
}

export function isObject(obj) {
  return {}.toString.apply(obj) === "[object Object]";
}

export function isString(obj) {
  return {}.toString.call(obj) === "[object String]";
}

export function isNumber(obj) {
  const objectType = {}.toString.apply(obj);
  return objectType === "[object Decimal]" || objectType === "[object Number]";
}

export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}
