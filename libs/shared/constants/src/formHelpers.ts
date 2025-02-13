export const isBsddTransporterFieldEditable = status =>
  ["SEALED", "RESEALED", "SIGNED_BY_PRODUCER"].includes(status);

export const objectsEqual = (o1, o2) => {
  if (isObject(o1) && isObject(o2)) {
    return (
      Object.keys(o1).length === Object.keys(o2).length &&
      Object.keys(o1).every(p => objectsEqual(o1[p], o2[p]))
    );
  }

  if (Array.isArray(o1) && Array.isArray(o2)) return arraysEqual(o1, o2);

  return o1 === o2;
};

const arraysEqual = (a1, a2) =>
  a1.length === a2.length && a1.every((o, idx) => objectsEqual(o, a2[idx]));

export const packagingsEqual = (p1, p2) =>
  arraysEqual(
    (p1 ? [...p1] : []).sort((p11, p12) => p11.type.localeCompare(p12.type)),
    (p2 ? [...p2] : []).sort((p21, p22) => p21.type.localeCompare(p22.type))
  );

function isObject(o) {
  return typeof o === "object" && !Array.isArray(o) && o !== null;
}
