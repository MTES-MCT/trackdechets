export const isBsddTransporterFieldEditable = status =>
  ["SEALED", "SIGNED_BY_PRODUCER"].includes(status);

export const objectsEqual = (o1, o2) => {
  return isObject(o1) && isObject(o2)
    ? Object.keys(o1).length === Object.keys(o2).length &&
        Object.keys(o1).every(p => objectsEqual(o1[p], o2[p]))
    : o1 === o2;
};

const arraysEqual = (a1, a2) =>
  a1.length === a2.length && a1.every((o, idx) => objectsEqual(o, a2[idx]));

export const packagingsEqual = (p1, p2) =>
  arraysEqual(
    (p1 ?? []).sort((p11, p12) => p11.type.localeCompare(p12.type)),
    (p2 ?? []).sort((p21, p22) => p21.type.localeCompare(p22.type))
  );

function isObject(o) {
  return typeof o === "object" && !Array.isArray(o) && o !== null;
}
