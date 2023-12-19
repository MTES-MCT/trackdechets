import React from "react";
import EstimatedQuantityTooltip from "../../../common/components/EstimatedQuantityTooltip";
import { Consistence, WasteAcceptationStatus, QuantityType } from "@td/codegen-ui";

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
    DOUGHY: "Pâteux"
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
    "PARTIALLY REFUSED": "Accepté partiellement"
  };

  return verbose[acceptationStatus];
};

export const getVerboseQuantityType = (
  quantityType: QuantityType | null | undefined | ""
): string | JSX.Element => {
  if (!quantityType) {
    return "";
  }

  return quantityType === "REAL" ? (
    "Réelle"
  ) : (
    <>
      Estimée <EstimatedQuantityTooltip />
    </>
  );
};

export const getVerboseWeightType = (
  isEstimate: Boolean | null | undefined | ""
): string | JSX.Element => {
  if (isEstimate === true) {
    return (
      <>
        Estimé <EstimatedQuantityTooltip />
      </>
    );
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
  const pathParts = path.split(".");
  for (let i = 0, len = pathParts.length; i < len; i++) {
    obj = obj[pathParts[i]];
  }
  return obj;
};
