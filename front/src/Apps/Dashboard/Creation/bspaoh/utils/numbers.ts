import Decimal from "decimal.js";

// Fix rogue decimals when displaying converted inputs
export const numberToString = (nb: number): string =>
  new Decimal(nb).toFixed(6);
