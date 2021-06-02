// eslint-disable-next-line import/no-duplicates
import { parseISO, format, toDate } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import fr from "date-fns/locale/fr";

export function parseDate(date: Date | number | string): Date {
  if (typeof date === "string") {
    return parseISO(date);
  }

  return toDate(date);
}

export function formatDate(date: Date | number | string): string {
  return format(parseDate(date), "dd/MM/y", {
    locale: fr,
  });
}
