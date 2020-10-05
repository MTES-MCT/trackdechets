export function omitDeepArrayWalk(arr: any[], key: string): any[] {
  return arr.map(val => {
    if (Array.isArray(val)) return omitDeepArrayWalk(val, key);
    else if (typeof val === "object") return omitDeep(val, key);
    return val;
  });
}

export function omitDeep(obj: any, key: string) {
  const keys = Object.keys(obj);
  const newObj: any = {};
  keys.forEach(i => {
    if (i !== key) {
      const val = obj[i];
      if (Array.isArray(val)) newObj[i] = omitDeepArrayWalk(val, key);
      else if (typeof val === "object" && val !== null)
        newObj[i] = omitDeep(val, key);
      else newObj[i] = val;
    }
  });
  return newObj;
}
