import { format } from "date-fns";
import fr from "date-fns/locale/fr";

/**
 * To get format YYYY-MM-DD
 */
export const toYYYYMMDD = (date: Date) => {
  return format(date, "yyyy-MM-dd", {
    locale: fr
  });
};

/**
 * To get format DD/MM/YYYY
 */
export const toDDMMYYYY = (date: Date) => {
  return format(date, "dd/MM/yyyy", {
    locale: fr
  });
};
