import {
  Consistence,
  WasteAcceptationStatus,
  QuantityType,
} from "generated/graphql/types";

export const getVerboseConsistence = (
  consistence: Consistence | null | undefined | ""
): string => {
  if (!consistence) {
    return "";
  }
  const verbose = {
    SOLID: "Solide",
    LIQUID: "Liquide",
    GASEOUS: "Gazeux",
    DOUGHY: "Pâteux",
  };
  return verbose[consistence];
};

export const getVerboseAcceptationStatus = (
  acceptationStatus: WasteAcceptationStatus | null | undefined | string
): string => {
  if (!acceptationStatus) {
    return "";
  }
  const verbose = {
    ACCEPTED: "Accepté",
    REFUSED: "Refusé",
    "PARTIALLY REFUSED": "Accepté partiellement",
  };

  return verbose[acceptationStatus];
};

export const getVerboseQuantityType = (
  quantityType: QuantityType | null | undefined | ""
): string => {
  if (!quantityType) {
    return "";
  }

  return quantityType === "REAL" ? "Réelle" : "Estimée";
};

export const getVerboseWeightType = (
  isEstimate: Boolean | null | undefined | ""
): string => {
  if (isEstimate === true) {
    return "Estimé";
  }
  if (isEstimate === false) {
    return "Réel";
  }

  return "";
};

/**
 * Enables to read the deep value of an object, passing the path as a string.
 * For instance, deepValue(obj, "foo.bar.baz") to access obj.foo.bar.baz.
 */
export const deepValue = (obj, path) => {
  // eslint-disable-next-line @typescript-eslint/no-redeclare
  for (var i = 0, path = path.split("."), len = path.length; i < len; i++) {
    obj = obj[path[i]];
  }
  return obj;
};
