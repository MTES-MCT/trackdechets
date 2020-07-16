/*
 * Group an array of object by key
 * Ex [{a: 1}, {a: 2}, {b: 1}] => {a : [1, 2], b: [1]}
 */
export function groupBy(key: string, array: { [id: string]: any }[]) {
  const result = {};
  for (const item of array) {
    let added = false;
    for (const k of Object.keys(result)) {
      if (k === item[key]) {
        result[k].push(item);
        added = true;
        break;
      }
    }
    if (!added) {
      result[item[key]] = [item];
    }
  }
  return result;
}
