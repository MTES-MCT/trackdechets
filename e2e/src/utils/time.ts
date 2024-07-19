import { format } from "date-fns";

/**
 * To get format YYYY-MM-DD
 */
export const toYYYYMMDD = (date: Date) => {
  return date.toISOString().split("T")[0];
};

/**
 * To get format DD/MM/YYYY
 */
export const toDDMMYYYY = (date: Date) => {
  return format(date, "dd/MM/yyyy");
};
