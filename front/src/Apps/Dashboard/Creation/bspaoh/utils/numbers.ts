import Decimal from "decimal.js";

// Fix rogue decimals when displaying converted inputs
export const numberToString = (nb: number, precision = 6): string =>
  new Decimal(nb).toFixed(precision);
