import Decimal from "decimal.js";

export const displayWasteQuantity = (quantity, units = "tonne(s)") => {
  if (quantity !== null && quantity !== undefined) {
    return `${new Decimal(quantity).toNumber()} ${units}`;
  }

  return "Non renseigné";
};
