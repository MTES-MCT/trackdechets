import Decimal from "decimal.js";
import { isDefined } from "../helpers";

export const displayWasteQuantity = (quantity, units = "tonne(s)") => {
  if (isDefined(quantity)) {
    return `${new Decimal(quantity).toDecimalPlaces(6).toNumber()} ${units}`;
  }

  return "Non renseignée";
};
