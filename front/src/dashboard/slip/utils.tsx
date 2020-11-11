import {
  Consistence,
  Packagings,
  WasteAcceptationStatusInput as WasteAcceptationStatus,
  QuantityType,
} from "generated/graphql/types";

export const getVerboseConsistence = (
  consistence: Consistence | null | undefined | ""
): string => {
  if (!consistence) {
    return "";
  }
  const verbose = { SOLID: "Solide", LIQUID: "Liquide", GASEOUS: "Gazeux" };
  return verbose[consistence];
};
export const getVerbosePackaging = (
  packaging: Packagings | null | undefined | ""
): string => {
  if (!packaging) {
    return "";
  }

  return packaging[0] + packaging.slice(1).toLowerCase();
};

export const formatPackagings = (
  packagings: Packagings[] | undefined
): string => {
  if (!packagings) return "";
  return packagings.map(p => getVerbosePackaging(p)).join(" ");
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
