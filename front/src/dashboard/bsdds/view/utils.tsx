import {
  Consistence,
  Packagings,
  WasteAcceptationStatusInput as WasteAcceptationStatus,
  QuantityType,
  PackagingInfo,
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
  packagingInfo: PackagingInfo | null | undefined | ""
): string => {
  if (!packagingInfo) {
    return "";
  }

  if (packagingInfo.type === Packagings.Autre) {
    return packagingInfo.other ?? "";
  }
  return packagingInfo.type[0] + packagingInfo.type.slice(1).toLowerCase();
};

export const formatPackagings = (
  packagingInfos: PackagingInfo[] | null | undefined
): string => {
  if (!packagingInfos) return "";
  return packagingInfos
    .map(p => `${getVerbosePackaging(p)} (${p.quantity})`)
    .join(", ");
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
